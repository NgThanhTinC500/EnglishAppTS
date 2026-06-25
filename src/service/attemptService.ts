import { In, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { AnswerResult, AttemptAnswer } from "../entity/AttemptAnswer";
import {
    Attempt,
    AttemptMode,
    AttemptPracticeMode,
    AttemptStatus,
} from "../entity/Attempt";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import { Question, QuestionCategory, QuestionType } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";
import { AppError } from "../utils/appError";

export class AttemptService {
    private attemptRepository: Repository<Attempt>;
    private attemptAnswerRepository: Repository<AttemptAnswer>;
    private examRepository: Repository<Exam>;
    private examQuestionRepository: Repository<ExamQuestion>;
    private questionRepository: Repository<Question>;
    private questionOptionRepository: Repository<QuestionOption>;

    constructor() {
        this.attemptRepository = AppDataSource.getRepository(Attempt);
        this.attemptAnswerRepository = AppDataSource.getRepository(AttemptAnswer);
        this.examRepository = AppDataSource.getRepository(Exam);
        this.examQuestionRepository = AppDataSource.getRepository(ExamQuestion);
        this.questionRepository = AppDataSource.getRepository(Question);
        this.questionOptionRepository = AppDataSource.getRepository(QuestionOption);
    }

    // helper methods
    // these methods are used to normalize and compare dictation answers,
    //  and to build the question data for attempt response
    // ex : "Hello, world!"  --> "hello world"
    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            // replace multiple spaces, newlines, 
            // and punctuation with a single space
            .replace(/[|\n\r]+/g, " ")
            // remove common punctuation characters
            .replace(/[.,!?;:"'()]/g, "")
            // replace multiple spaces with a single space
            .replace(/\s+/g, " ");
    }

    // these methods are used to validate the input parameters,
    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private validatePracticeMode(value: AttemptPracticeMode) {
        if (!Object.values(AttemptPracticeMode).includes(value)) {
            throw new AppError("Invalid practice mode", 400);
        }
    }

    private questionMatchesPracticeMode(question: Question, practiceMode: AttemptPracticeMode) {
        if (practiceMode === AttemptPracticeMode.GRAMMAR) {
            return question.type === QuestionType.SINGLE_CHOICE &&
                question.category === QuestionCategory.GRAMMAR;
        }

        if (practiceMode === AttemptPracticeMode.LISTENING_CHECK) {
            return question.type === QuestionType.SINGLE_CHOICE &&
                question.category === QuestionCategory.LISTENING;
        }

        return question.type === QuestionType.DICTATION &&
            question.category === QuestionCategory.LISTENING;
    }

    private filterExamQuestionsByPracticeMode(
        examQuestions: ExamQuestion[],
        practiceMode: AttemptPracticeMode
    ) {
        return examQuestions.filter(
            (examQuestion) =>
                examQuestion.question &&
                this.questionMatchesPracticeMode(examQuestion.question, practiceMode)
        );
    }

    private ensureQuestionMatchesPracticeMode(attempt: Attempt, question: Question) {
        if (!this.questionMatchesPracticeMode(question, attempt.practiceMode)) {
            throw new AppError("Question does not match this attempt practice mode", 400);
        }
    }

    /*
    id | examId | questionId
    1  | 17     | 29
    2  | 17     | 30
    3  | 17     | 31
    return [29, 30, 31]
    */
    // get all questionIds of an exam
    private async getExamQuestionIds(examId: number) {
        const examQuestions = await this.examQuestionRepository.find({
            where: { examId },
            // only select questionId to optimize the query 
            // since we only need questionIds
            select: { questionId: true }
        });

        return examQuestions.map((item) => item.questionId);
    }

    // this method is used to check if a question belongs to the exam of the attempt\
    // ex : if attempt.examId = 17, check if questionId belongs to examId 17
    private async ensureQuestionBelongsToAttemptExam(attempt: Attempt, questionId: number) {
        if (!attempt.examId) {
            throw new AppError("Attempt is not linked to an exam", 400);
        }

        const examQuestion = await this.examQuestionRepository.findOne({
            where: { examId: attempt.examId, questionId }
        });

        if (!examQuestion) {
            throw new AppError("Question does not belong to this attempt exam", 400);
        }
    }

    // this method is used to calculate the progress of an attempt,
    //  including total questions, answered questions, remaining questions, and percentage of completion
    // ex : if an exam has 10 questions, and the user has answered 4 questions, then the progress is:
    // {
    //   totalQuestions: 10,
    //   answeredCount: 4,
    //   remainingCount: 6,
    //   percent: 40
    // }
    private async getProgress(attempt: Attempt, scopedQuestionIds?: number[]) {
        // Use scopedQuestionIds when the UI is practicing one mode only,
        // for example listening check or dictation.
        const examQuestionIds = scopedQuestionIds
            ? scopedQuestionIds
            : attempt.examId
                ? await this.getExamQuestionIds(attempt.examId)
                : [];
        const totalQuestions = examQuestionIds.length;
        const answeredCount = totalQuestions > 0
            ? await this.attemptAnswerRepository.count({
                where: { attemptId: attempt.id, questionId: In(examQuestionIds) }
            })
            : 0;

        return {
            totalQuestions,
            answeredCount,
            remainingCount: Math.max(totalQuestions - answeredCount, 0),
            percent: totalQuestions > 0
                ? Number(((answeredCount / totalQuestions) * 100).toFixed(2))
                : 0
        };
    }

    // this method is used to escape special characters in a string for use in a regular expression
    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // this method is used to convert a QuestionOption entity 
    // to a format suitable for returning in the API response
    private toPublicOption(option: QuestionOption) {
        return {
            id: option.id,
            questionId: option.questionId,
            label: option.label,
            content: option.content
        };
    }

    private toAnswerOption(option?: QuestionOption | null) {
        return option
            ? {
                id: option.id,
                label: option.label,
                content: option.content
            }
            : null;
    }

    // replace the first occurrence of the answer in the transcript with [BLANK],
    //  and return the modified transcript
    private replaceFirstAnswerWithBlank(transcript: string, answer: string) {
        // Keep a boundary around the answer so short words do not replace inside another word.
        const escapedAnswer = this.escapeRegExp(answer);
        const pattern = new RegExp(`(^|[\\s.,!?;:"'()])(${escapedAnswer})(?=$|[\\s.,!?;:"'()])`, "i");

        return transcript.replace(pattern, (_match, prefix) => `${prefix}[BLANK]`);
    }

    // Call replaceFirstAnswerWithBlank once for each answer in the array, 
    // using reduce to get the result of the previous one before starting the next one.
    /*
        transcript = "The boy is drinking coffee"
        answers    = ["boy", "drinking", "coffee"]

        Step 1: "The [BLANK] is drinking coffee"
        Step 2: "The [BLANK] is [BLANK] coffee"
        Step 3: "The [BLANK] is [BLANK] [BLANK]"
    */
    private replaceAnswersWithBlank(transcript: string, answers: string[]) {
        return answers.reduce((maskedTranscript, answer) => {
            return this.replaceFirstAnswerWithBlank(maskedTranscript, answer);
        }, transcript);
    }

    // this method is used to split the dictationAnswer field 
    // of a question into an array of correct answers,
    // ex : "answer1, answer2, answer3" --> ["answer1", "answer2", "answer3"]
    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",") // split return an array of strings, ex : "answer1, answer2, answer3" --> ["answer1", " answer2", " answer3"]
            .map((answer) => answer.trim())
            // filter out empty strings ex : 
            // ["answer1", " answer2", ""] --> ["answer1", "answer2"]
            .filter(Boolean);
    }

    private getCorrectDictationAnswers(question?: Question | null) {
        return question?.type === QuestionType.DICTATION
            ? this.splitDictationAnswers(question.dictationAnswer)
            : [];
    }


    // this method is used to build the masked transcript for a dictation question,
    //  by replacing the correct answers in the transcript with [BLANK]
    /*
        transcript = "The boy is drinking coffee"
        dictationAnswer = "boy, drinking, coffee"
        maskedTranscript = "The [BLANK] is [BLANK] [BLANK]"
    */
    private buildMaskedTranscript(question: Question) {
        if (question.type !== QuestionType.DICTATION || !question.transcript || !question.dictationAnswer) {
            return undefined;
        }

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        if (!correctAnswers.length) return undefined;
        // if the transcript already contains [BLANK],
        //  we assume it's already masked and return it as is to avoid masking multiple times
        if (question.transcript.includes("[BLANK]"))
            return question.transcript;

        return this.replaceAnswersWithBlank(question.transcript, correctAnswers);
    }

    // this method is used to build the question data for attempt response,
    //  including masking the transcript for dictation questions
    private toQuestionForAttempt(question: Question) {
        return {
            id: question.id,
            category: question.category,
            type: question.type,
            content: question.content,
            audioUrl: question.audioUrl,
            audioFileName: question.audioFileName,
            transcript: question.showTranscript ? question.transcript : undefined,
            maskedTranscript: this.buildMaskedTranscript(question),
            showTranscript: question.showTranscript,
            options: question.options?.map((option) => this.toPublicOption(option)) ?? []
        };
    }

    // this method is used to build the answered questions data for attempt response,
    //  by fetching the AttemptAnswer records for the attempt and the questions in the exam,
    //  and mapping them to the format suitable for returning in the API response
    // Load answered questions for this attempt so the UI can restore progress.
    // Includes both correct and wrong answers when the user resumes.
    private async buildAnsweredQuestions(
        attemptId: number,
        exam: Exam,
        scopedExamQuestions = exam.examQuestions
    ) {
        // get all questionIds of the exam
        const examQuestionIds = scopedExamQuestions.map((eq) => eq.questionId);
        if (!examQuestionIds.length) return [];

        // get all AttemptAnswer records for the attempt and the questions in the exam
        const rawAnswers = await this.attemptAnswerRepository.find({
            where: { attemptId, questionId: In(examQuestionIds) },
        });
        if (!rawAnswers.length) return [];

        const questionById = new Map(
            scopedExamQuestions
                .filter((eq) => eq.question)
                .map((eq) => [eq.questionId, eq.question])
        );
        // create a map of question IDs to their order indices
        const orderByQuestionId = new Map(
            scopedExamQuestions.map((eq) => [eq.questionId, eq.orderIndex])
        );

        return rawAnswers
            .sort((a, b) =>
                (orderByQuestionId.get(a.questionId) ?? 0) -
                (orderByQuestionId.get(b.questionId) ?? 0)
            )
            .map((answer) => {
                // get the question for this answer from the map
                const question = questionById.get(answer.questionId);
                // find the selected option and correct option for this question
                const selectedOption = question?.options?.find((o) => o.id === answer.selectedOptionId);
                // find the correct option for this question
                const correctOption = question?.options?.find((o) => o.isCorrect);

                return {
                    questionId: answer.questionId,
                    selectedOptionId: answer.selectedOptionId,
                    // Return only the option fields needed by the client.
                    selectedOption: this.toAnswerOption(selectedOption),
                    answerText: answer.answerText,
                    result: answer.result,
                    correctOptionId: correctOption?.id ?? null,
                    correctOption: this.toAnswerOption(correctOption),
                    correctAnswers: this.getCorrectDictationAnswers(question),
                    explanation: question?.explanation ?? null,
                    transcript: question?.transcript ?? null,
                };
            });
    }

    // start a new attempt for an exam,
    //  or return existing in-progress attempt if exists
    async startExam(
        userId: string,
        examId: number,
        restart = false,
        practiceMode = AttemptPracticeMode.GRAMMAR
    ) {
        this.ensurePositiveInteger(examId, "examId");
        this.validatePracticeMode(practiceMode);

        const exam = await this.examRepository.findOne({
            where: {
                id: examId, isActive: true
            },
            relations: {
                examQuestions:
                {
                    question:
                    {
                        options: true
                    }
                }
            },
            order: { examQuestions: { orderIndex: "ASC" } },
        });
        if (!exam) throw new AppError("Exam not found", 404);

        // find existing in-progress attempt for this user and exam
        const existingAttempt = await this.attemptRepository.findOne({
            where: {
                userId,
                examId,
                practiceMode,
                status: AttemptStatus.IN_PROGRESS,
            },
        });
        // if restart=true, expire the existing attempt and create a new one
        if (restart && existingAttempt) {
            existingAttempt.status = AttemptStatus.EXPIRED;
            existingAttempt.submittedAt = new Date();
            await this.attemptRepository.save(existingAttempt);
        }

        // if restart=false, return the existing attempt;
        //  otherwise create a new attempt
        const attempt = !restart && existingAttempt
            ? existingAttempt
            : await this.attemptRepository.save(
                this.attemptRepository.create({
                    userId,
                    examId,
                    mode: AttemptMode.PRACTICE,
                    practiceMode,
                    status: AttemptStatus.IN_PROGRESS,
                    startedAt: new Date(),
                })
            );

        const scopedExamQuestions = this.filterExamQuestionsByPracticeMode(
            exam.examQuestions,
            attempt.practiceMode
        );
        const answeredQuestions = await this.buildAnsweredQuestions(
            attempt.id,
            exam,
            scopedExamQuestions
        );

        return {
            attempt,
            questions: scopedExamQuestions
                .map((eq) => this.toQuestionForAttempt(eq.question)),
            answeredQuestions,
        };
    }
    // answer a question in an attempt, 
    // create or update the corresponding AttemptAnswer record
    async answerQuestion(attemptId: number, userId: string, questionId: number, selectedOptionId: number) {
        this.ensurePositiveInteger(attemptId, "attemptId");
        this.ensurePositiveInteger(questionId, "questionId");
        this.ensurePositiveInteger(selectedOptionId, "selectedOptionId");

        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId }
        });
        if (!attempt) throw new AppError("Attempt not found", 404);
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Attempt is not in progress", 400);
        }
        await this.ensureQuestionBelongsToAttemptExam(attempt, questionId);

        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            select: ["id", "category", "type", "explanation", "transcript"]
        });
        if (!question) throw new AppError("Question not found", 404);
        this.ensureQuestionMatchesPracticeMode(attempt, question);
        if (question.type !== QuestionType.SINGLE_CHOICE) {
            throw new AppError("Question is not a single choice question", 400);
        }

        const options = await this.questionOptionRepository.find({
            where: { questionId }
        });
        if (!options.length) throw new AppError("Question has no options", 400);

        const selectedOption = options.find((option) => option.id === selectedOptionId);
        if (!selectedOption) throw new AppError("Selected option does not belong to this question", 404);

        const correctOption = options.find((option) => option.isCorrect);
        if (!correctOption) {
            throw new AppError("Question has no correct option", 400);
        }

        await this.attemptAnswerRepository.upsert({
            attemptId,
            questionId,
            selectedOptionId,
            answerText: null,
            result: selectedOption.isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG,
            answeredAt: new Date(),
        }, ["attemptId", "questionId"]);

        const savedAnswer = await this.attemptAnswerRepository.findOneOrFail({
            where: { attemptId, questionId }
        });

        return {
            answerId: savedAnswer.id,
            selectedOptionId: selectedOption.id,
            selectedOption: this.toAnswerOption(selectedOption),
            isCorrect: selectedOption.isCorrect,
            correctOptionId: correctOption?.id ?? null,
            correctOption: this.toAnswerOption(correctOption),
            explanation: question.explanation ?? null,
            transcript: question.transcript ?? null,
        };
    }

    async answerDictation(
        attemptId: number,
        userId: string,
        questionId: number,
        answerText: string,
        answers?: string[]
    ) {
        this.ensurePositiveInteger(attemptId, "attemptId");
        this.ensurePositiveInteger(questionId, "questionId");

        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId }
        });
        if (!attempt) throw new AppError("Attempt not found", 404);
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Attempt is not in progress", 400);
        }
        await this.ensureQuestionBelongsToAttemptExam(attempt, questionId);

        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });
        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Dictation question not found", 404);
        }
        this.ensureQuestionMatchesPracticeMode(attempt, question);
        if (!question.dictationAnswer) {
            throw new AppError("Dictation answer is not configured", 400);
        }
        if (!answerText.trim() && !answers?.length) {
            throw new AppError("answerText is required", 400);
        }

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        const userAnswers = Array.isArray(answers)
            ? answers.map((answer) => String(answer ?? "").trim())
            : [];
        const answerTextForStorage = userAnswers.length
            ? userAnswers.join(" ")
            : answerText.trim();
        // Compare each blank by position when the client sends an answers array.
        const isCorrect = userAnswers.length
            ? userAnswers.length === correctAnswers.length &&
            correctAnswers.every(
                (answer, index) =>
                    this.normalizeAnswer(userAnswers[index] ?? "") === this.normalizeAnswer(answer)
            )
            : this.normalizeAnswer(answerTextForStorage) === this.normalizeAnswer(correctAnswers.join(" "));
        const result = isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG;

        await this.attemptAnswerRepository.upsert({
            attemptId,
            questionId,
            selectedOptionId: null,
            answerText: answerTextForStorage,
            result,
            answeredAt: new Date(),
        }, ["attemptId", "questionId"]);

        const savedAnswer = await this.attemptAnswerRepository.findOneOrFail({
            where: { attemptId, questionId }
        });

        return {
            answer: savedAnswer,
            isCorrect: result === AnswerResult.CORRECT,
            correctAnswers,
            explanation: question.explanation,
            transcript: question.transcript,
            progress: await this.getProgress(attempt, [questionId])
        };
    }


    async submitExam(attemptId: number, userId: string, examId: number, questionIds?: number[]) {
        this.ensurePositiveInteger(attemptId, "attemptId");
        this.ensurePositiveInteger(examId, "examId");

        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId, examId }
        });
        if (!attempt) {
            throw new AppError("Attempt not found", 404);
        }
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Exam attempt is not in progress", 400);
        }

        const exam = await this.examRepository.findOne({
            where: { id: examId },
            relations: {
                examQuestions: {
                    question: true
                }
            }
        });
        if (!exam) throw new AppError("Exam not found", 404);

        const scopedExamQuestions = this.filterExamQuestionsByPracticeMode(
            exam.examQuestions,
            attempt.practiceMode
        );
        const scopedExamQuestionIds = scopedExamQuestions
            .slice()
            .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
            .map((item) => item.questionId);
        const allExamQuestionIds = exam.examQuestions.map((item) => item.questionId);
        let examQuestionIds = scopedExamQuestionIds;
        let isScopedSubmit = false;

        if (!scopedExamQuestionIds.length) {
            throw new AppError("No questions available for this practice mode", 400);
        }

        if (questionIds !== undefined) {
            if (!Array.isArray(questionIds)) {
                throw new AppError("questionIds must be an array", 400);
            }

            const scopedQuestionIds = [...new Set(questionIds.map(Number))];
            if (!scopedQuestionIds.length) {
                throw new AppError("questionIds must not be empty", 400);
            }

            const hasInvalidQuestionId = scopedQuestionIds.some(
                (questionId) => !Number.isInteger(questionId) || questionId <= 0
            );
            if (hasInvalidQuestionId) {
                throw new AppError("questionIds must contain positive integers", 400);
            }

            const outOfExamQuestionIds = scopedQuestionIds.filter(
                (questionId) => !allExamQuestionIds.includes(questionId)
            );
            if (outOfExamQuestionIds.length) {
                throw new AppError("Some questions do not belong to this exam", 400);
            }

            const outOfPracticeModeQuestionIds = scopedQuestionIds.filter(
                (questionId) => !scopedExamQuestionIds.includes(questionId)
            );
            if (outOfPracticeModeQuestionIds.length) {
                throw new AppError("Some questions do not match this attempt practice mode", 400);
            }

            // Keep the exam order even when the client submits a scoped question list.
            examQuestionIds = scopedExamQuestionIds.filter((questionId) =>
                scopedQuestionIds.includes(questionId)
            );
            isScopedSubmit = scopedQuestionIds.length !== scopedExamQuestionIds.length;
        }

        const totalQuestions = examQuestionIds.length;
        const answers = totalQuestions > 0
            ? await this.attemptAnswerRepository.find({
                where: { attemptId, questionId: In(examQuestionIds) }
            })
            : [];
        const correctCount = answers.filter(
            (item) => item.result === AnswerResult.CORRECT
        ).length;
        const wrongCount = answers.filter(
            (item) => item.result === AnswerResult.WRONG
        ).length;
        const score = totalQuestions > 0
            ? Number(((correctCount / totalQuestions) * 10).toFixed(2))
            : 0;

        let savedAttempt = attempt;
        if (!isScopedSubmit) {
            attempt.status = AttemptStatus.SUBMITTED;
            attempt.score = score;
            attempt.totalQuestions = totalQuestions;
            attempt.correctCount = correctCount;
            attempt.submittedAt = new Date();
            savedAttempt = await this.attemptRepository.save(attempt);
        }
        const detailedAnswers = totalQuestions > 0
            ? await this.attemptAnswerRepository.find({
                where: { attemptId, questionId: In(examQuestionIds) },
                relations: {
                    question: {
                        options: true
                    },
                    selectedOption: true
                }
            })
            : [];
        const detailedAnswerByQuestionId = new Map(
            detailedAnswers.map((item) => [item.questionId, item])
        );
        const questions = totalQuestions > 0
            ? await this.questionRepository.find({
                where: { id: In(examQuestionIds) },
                relations: { options: true }
            })
            : [];
        const questionById = new Map(
            questions.map((question) => [question.id, question])
        );

        return {
            attempt: savedAttempt,
            scope: {
                isScopedSubmit,
                questionIds: examQuestionIds
            },
            summary: {
                totalQuestions,
                answeredCount: answers.length,
                correctCount,
                wrongCount,
                unansweredCount: Math.max(totalQuestions - answers.length, 0),
                incorrectOrUnansweredCount: Math.max(totalQuestions - correctCount, 0),
                score
            },
            answers: examQuestionIds.map((questionId) => {
                const item = detailedAnswerByQuestionId.get(questionId);
                const question = item?.question ?? questionById.get(questionId);
                const correctOption = question?.options?.find((option) => option.isCorrect) ?? null;
                const answered = Boolean(item);

                return {
                    questionId,
                    questionType: question?.type,
                    content: question?.content,
                    selectedOptionId: item?.selectedOptionId ?? null,
                    selectedOption: this.toAnswerOption(item?.selectedOption),
                    answerText: item?.answerText ?? null,
                    correctOptionId: correctOption?.id ?? null,
                    correctOption: this.toAnswerOption(correctOption),
                    correctAnswers: this.getCorrectDictationAnswers(question),
                    result: item?.result ?? "unanswered",
                    answered,
                    explanation: question?.explanation ?? null,
                    transcript: question?.transcript ?? null
                };
            })
        };
    }
}