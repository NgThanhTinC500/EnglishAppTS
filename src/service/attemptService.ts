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
import { generateAnswerExplanation } from "./aiHintService";

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

    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

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

    private async getExamQuestionIds(examId: number) {
        const examQuestions = await this.examQuestionRepository.find({
            where: { examId },
            select: { questionId: true }
        });

        return examQuestions.map((item) => item.questionId);
    }

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

    private async getProgress(attempt: Attempt, scopedQuestionIds?: number[]) {
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

    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

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

    private getReviewSuggestion(question: Question) {
        const text = `${question.content ?? ""} ${question.explanation ?? ""}`.toLowerCase();

        if (question.category === QuestionCategory.LISTENING) {
            if (text.includes("why") || text.includes("because")) {
                return "Nên ôn cách nghe câu hỏi Why và các tín hiệu nguyên nhân như because, due to, reason.";
            }
            if (text.includes("where") || text.includes("platform") || text.includes("desk")) {
                return "Nên ôn câu hỏi Where, giới từ vị trí và từ vựng địa điểm thường gặp trong TOEIC.";
            }
            if (text.includes("when") || text.includes("time") || text.includes("noon") || text.includes("scheduled")) {
                return "Nên ôn cách nghe mốc thời gian, giờ giấc và deadline.";
            }
            if (text.includes("who") || text.includes("visitor") || text.includes("attendee")) {
                return "Nên ôn câu hỏi Who và cách bắt từ khóa chỉ người hoặc bộ phận.";
            }
            return "Nên ôn kỹ năng bắt keyword chính trong câu hỏi nghe TOEIC.";
        }

        if (text.includes("modal") || text.includes("must") || text.includes("will")) {
            return "Nên ôn modal/future + động từ nguyên mẫu.";
        }
        if (text.includes("passive") || text.includes("bị động")) {
            return "Nên ôn câu bị động: be + V3 và cách nhận diện chủ ngữ nhận hành động.";
        }
        if (text.includes("present perfect") || text.includes("since") || text.includes("for")) {
            return "Nên ôn hiện tại hoàn thành với since/for.";
        }
        if (text.includes("past perfect") || text.includes("before")) {
            return "Nên ôn quá khứ hoàn thành và mốc hành động xảy ra trước trong quá khứ.";
        }
        if (text.includes("preposition") || text.includes("giới từ")) {
            return "Nên ôn giới từ thường gặp trong TOEIC: in, on, at, by, until, during.";
        }
        if (text.includes("connector") || text.includes("because") || text.includes("although") || text.includes("however")) {
            return "Nên ôn connectors chỉ nguyên nhân, tương phản, kết quả và mục đích.";
        }
        if (text.includes("adjective") || text.includes("adverb") || text.includes("noun") || text.includes("word forms")) {
            return "Nên ôn word forms: vị trí danh từ, động từ, tính từ và trạng từ.";
        }

        return "Nên ôn lại cấu trúc ngữ pháp chính của câu và dấu hiệu nhận biết đáp án.";
    }

    private buildFallbackSingleChoiceExplanation(
        question: Question,
        selectedOption: QuestionOption,
        correctOption: QuestionOption
    ) {
        const answerState = selectedOption.isCorrect
            ? `Bạn đã chọn đúng đáp án "${correctOption.content}".`
            : `Bạn đã chọn "${selectedOption.content}", nhưng đáp án đúng là "${correctOption.content}".`;

        return [
            `Cấu trúc ngữ pháp: ${question.explanation || this.getReviewSuggestion(question)}`,
            `Lý do chọn đáp án ${correctOption.label}: "${correctOption.content}" khớp với dữ liệu đáp án đúng của câu hỏi trong database.`,
            `Vì sao đáp án đã chọn sai/đúng: ${answerState} ${this.getReviewSuggestion(question)}`,
        ].join("\n");
    }

    private async buildSingleChoiceExplanation(
        question: Question,
        selectedOption: QuestionOption,
        correctOption: QuestionOption,
        options: QuestionOption[]
    ) {
        const fallbackExplanation = this.buildFallbackSingleChoiceExplanation(
            question,
            selectedOption,
            correctOption
        );

        try {
            const explanation = await generateAnswerExplanation({
                questionContent: question.content,
                category: question.category,
                transcript: question.transcript,
                selectedOption: {
                    label: selectedOption.label,
                    content: selectedOption.content,
                },
                correctOption: {
                    label: correctOption.label,
                    content: correctOption.content,
                },
                options: options.map((option) => ({
                    label: option.label,
                    content: option.content,
                    isCorrect: option.isCorrect,
                })),
                existingExplanation: question.explanation,
            });

            return {
                explanation,
                aiHint: explanation,
                explanationSource: "api",
            };
        } catch {
            return {
                explanation: fallbackExplanation,
                aiHint: fallbackExplanation,
                explanationSource: "fallback",
            };
        }
    }

    private async buildSubmittedSingleChoiceExplanation(
        question: Question,
        selectedOption: QuestionOption | null | undefined,
        correctOption: QuestionOption,
        options: QuestionOption[]
    ) {
        if (selectedOption) {
            const result = await this.buildSingleChoiceExplanation(
                question,
                selectedOption,
                correctOption,
                options
            );

            return result.explanation;
        }

        const fallbackExplanation = [
            `Cấu trúc ngữ pháp: ${question.explanation || this.getReviewSuggestion(question)}`,
            `Lý do chọn đáp án ${correctOption.label}: "${correctOption.content}" là đáp án đúng theo dữ liệu câu hỏi trong database.`,
            "Vì sao đáp án đã chọn sai/đúng: Bạn chưa chọn đáp án cho câu này.",
        ].join("\n");

        try {
            return await generateAnswerExplanation({
                questionContent: question.content,
                category: question.category,
                transcript: question.transcript,
                selectedOption: {
                    label: "-",
                    content: "Chưa chọn đáp án",
                },
                correctOption: {
                    label: correctOption.label,
                    content: correctOption.content,
                },
                options: options.map((option) => ({
                    label: option.label,
                    content: option.content,
                    isCorrect: option.isCorrect,
                })),
                existingExplanation: question.explanation,
            });
        } catch {
            return fallbackExplanation;
        }
    }

    private replaceFirstAnswerWithBlank(transcript: string, answer: string) {
        // Keep a boundary around the answer so short words do not replace inside another word.
        const escapedAnswer = this.escapeRegExp(answer);
        const pattern = new RegExp(`(^|[\\s.,!?;:"'()])(${escapedAnswer})(?=$|[\\s.,!?;:"'()])`, "i");

        return transcript.replace(pattern, (_match, prefix) => `${prefix}[BLANK]`);
    }

    private replaceAnswersWithBlank(transcript: string, answers: string[]) {
        return answers.reduce((maskedTranscript, answer) => {
            return this.replaceFirstAnswerWithBlank(maskedTranscript, answer);
        }, transcript);
    }

    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",")
            .map((answer) => answer.trim())
            .filter(Boolean);
    }

    private getCorrectDictationAnswers(question?: Question | null) {
        return question?.type === QuestionType.DICTATION
            ? this.splitDictationAnswers(question.dictationAnswer)
            : [];
    }


    private buildMaskedTranscript(question: Question) {
        if (question.type !== QuestionType.DICTATION || !question.transcript || !question.dictationAnswer) {
            return undefined;
        }

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        if (!correctAnswers.length) return undefined;
        if (question.transcript.includes("[BLANK]"))
            return question.transcript;

        return this.replaceAnswersWithBlank(question.transcript, correctAnswers);
    }

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

    private async buildAnsweredQuestions(
        attemptId: number,
        exam: Exam,
        scopedExamQuestions = exam.examQuestions
    ) {
        const examQuestionIds = scopedExamQuestions.map((eq) => eq.questionId);
        if (!examQuestionIds.length) return [];

        const rawAnswers = await this.attemptAnswerRepository.find({
            where: { attemptId, questionId: In(examQuestionIds) },
        });
        if (!rawAnswers.length) return [];

        const questionById = new Map(
            scopedExamQuestions
                .filter((eq) => eq.question)
                .map((eq) => [eq.questionId, eq.question])
        );
        const orderByQuestionId = new Map(
            scopedExamQuestions.map((eq) => [eq.questionId, eq.orderIndex])
        );

        return rawAnswers
            .sort((a, b) =>
                (orderByQuestionId.get(a.questionId) ?? 0) -
                (orderByQuestionId.get(b.questionId) ?? 0)
            )
            .map((answer) => {
                const question = questionById.get(answer.questionId);
                const selectedOption = question?.options?.find((o) => o.id === answer.selectedOptionId);
                const correctOption = question?.options?.find((o) => o.isCorrect);

                return {
                    questionId: answer.questionId,
                    selectedOptionId: answer.selectedOptionId,
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

        const existingAttempt = await this.attemptRepository.findOne({
            where: {
                userId,
                examId,
                practiceMode,
                status: AttemptStatus.IN_PROGRESS,
            },
        });
        if (restart && existingAttempt) {
            existingAttempt.status = AttemptStatus.EXPIRED;
            existingAttempt.submittedAt = new Date();
            await this.attemptRepository.save(existingAttempt);
        }

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
            select: ["id", "category", "type", "content", "explanation", "transcript"]
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

        const answerExplanation = await this.buildSingleChoiceExplanation(
            question,
            selectedOption,
            correctOption,
            options
        );

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
            explanation: answerExplanation.explanation,
            aiHint: answerExplanation.aiHint,
            explanationSource: answerExplanation.explanationSource,
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

        const answerPayloads = await Promise.all(examQuestionIds.map(async (questionId) => {
            const item = detailedAnswerByQuestionId.get(questionId);
            const question = item?.question ?? questionById.get(questionId);
            const correctOption = question?.options?.find((option) => option.isCorrect) ?? null;
            const selectedOption = item?.selectedOption ??
                question?.options?.find((option) => option.id === item?.selectedOptionId) ??
                null;
            const answered = Boolean(item);
            const explanation = question?.type === QuestionType.SINGLE_CHOICE && correctOption
                ? await this.buildSubmittedSingleChoiceExplanation(
                    question,
                    selectedOption,
                    correctOption,
                    question.options ?? []
                )
                : question?.explanation ?? null;

            return {
                questionId,
                questionType: question?.type,
                content: question?.content,
                selectedOptionId: item?.selectedOptionId ?? null,
                selectedOption: this.toAnswerOption(selectedOption),
                answerText: item?.answerText ?? null,
                correctOptionId: correctOption?.id ?? null,
                correctOption: this.toAnswerOption(correctOption),
                correctAnswers: this.getCorrectDictationAnswers(question),
                result: item?.result ?? "unanswered",
                answered,
                explanation,
                transcript: question?.transcript ?? null
            };
        }));

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
            answers: answerPayloads
        };
    }
}
