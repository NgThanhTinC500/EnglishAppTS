import { AppDataSource } from "../data-source";
import { Question, QuestionCategory, QuestionType } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";

import { Topic } from "../entity/Topic";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import { AppError } from "../utils/appError";

export class QuestionService {
    private questionRepository = AppDataSource.getRepository(Question);
    private optionRepository = AppDataSource.getRepository(QuestionOption);
    private topicRepository = AppDataSource.getRepository(Topic);
    private examRepository = AppDataSource.getRepository(Exam);
    private examQuestionRepository = AppDataSource.getRepository(ExamQuestion);



    // convert "A,B,C" => ["A", "B", "C"]
    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",")
            .map(answer => answer.trim())
            .filter(Boolean);
    }

    // convert to lower case
    private normalizeDictationAnswer(value: string) {
        return value.trim().toLowerCase();
    }

    // mask transcript by replacing correct answers with [BLANK]
    // transcript:     "The quick brown fox"
    // correctAnswers: ["quick", "brown"]
    // result:         "The [BLANK] [BLANK] fox"
    private maskTranscript(transcript: string | null, correctAnswers: string[]) {
        if (!transcript) return transcript;
        if (transcript.includes("[BLANK]")) return transcript;

        return correctAnswers.reduce((maskedTranscript, answer) => {
            if (!answer) return maskedTranscript;
            const escapedAnswer = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return maskedTranscript.replace(new RegExp(`\\b${escapedAnswer}\\b`, "i"), "[BLANK]");
        }, transcript);
    }


    // convert Question entity to a safe object for API response 
    // by removing correct answer and other sensitive info
    private toSafeQuestion(question: Question | null) {
        if (!question) return question;

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        return {
            id: question.id,
            category: question.category,
            type: question.type,
            content: question.content,
            explanation: question.explanation,
            audioUrl: question.audioUrl,
            audioFileName: question.audioFileName,
            transcript: question.showTranscript
                ? question.transcript
                : this.maskTranscript(question.transcript, correctAnswers),
            showTranscript: question.showTranscript,
            options: question.options?.map(option => ({
                id: option.id,
                questionId: option.questionId,
                label: option.label,
                content: option.content
            })) ?? [],
            createdAt: question.createdAt,
            updatedAt: question.updatedAt
        };
    }

    async createQuestion(data: {
        type?: QuestionType;
        category?: QuestionCategory;
        content?: string | null;
        explanation?: string | null;
        audioUrl?: string | null;
        audioFileName?: string | null;
        transcript?: string | null;
        showTranscript?: boolean;
        dictationAnswer?: string | null;
        options?: {
            label: string;
            content: string;
            isCorrect: boolean;
        }[];
        examId?: number;
    }) {
        return AppDataSource.transaction(async (manager) => {
            const questionRepo = manager.getRepository(Question);
            const optionRepo = manager.getRepository(QuestionOption);
            const examRepo = manager.getRepository(Exam);
            const examQuestionRepo = manager.getRepository(ExamQuestion);
            const questionType = data.type ?? QuestionType.SINGLE_CHOICE;
            const questionCategory = data.category ?? QuestionCategory.GRAMMAR;

            // ===== VALIDATE =====
            if (questionType === QuestionType.SINGLE_CHOICE) {
                if (!data.content || data.content.trim() === "") {
                    throw new AppError("Question content is required", 400);
                }
                if (!data.options || data.options.length < 2) {
                    throw new AppError("At least 2 options required", 400);
                }
                const correctCount = data.options.filter(o => o.isCorrect).length;
                if (correctCount !== 1) {
                    throw new AppError("Must have exactly 1 correct answer", 400);
                }
            }

            if (questionType === QuestionType.DICTATION) {
                if (!data.dictationAnswer?.trim()) {
                    throw new AppError("Dictation answer is required", 400);
                }
                if (!data.audioUrl) {
                    throw new AppError("Audio is required for dictation", 400);
                }
                if (!data.transcript?.trim()) {
                    throw new AppError("Transcript is required for dictation", 400);
                }
            }

            // ===== CREATE QUESTION =====
            const question = questionRepo.create({
                type: questionType,
                category: questionCategory,
                content: questionType === QuestionType.DICTATION
                    ? data.transcript?.trim() ?? null
                    : data.content?.trim() ?? null,
                explanation: data.explanation ?? null,
                audioUrl: data.audioUrl ?? null,
                audioFileName: data.audioFileName ?? null,
                transcript: data.transcript ?? null,
                showTranscript: data.showTranscript ?? false,
                dictationAnswer: data.dictationAnswer?.trim() ?? null,
            });

            const savedQuestion = await questionRepo.save(question);

            // ===== CREATE OPTIONS =====
            if (questionType === QuestionType.SINGLE_CHOICE && data.options) {
                const options = data.options.map(opt =>
                    optionRepo.create({
                        questionId: savedQuestion.id,
                        label: opt.label.toUpperCase(),
                        content: opt.content,
                        isCorrect: opt.isCorrect,
                    })
                );
                await optionRepo.save(options);
            }

            // ===== ADD TO EXAM (optional) =====
            if (data.examId) {
                const exam = await examRepo.findOne({ where: { id: data.examId } });
                if (!exam) throw new AppError("Exam not found", 404);

                const last = await examQuestionRepo.findOne({
                    where: { examId: data.examId },
                    order: { orderIndex: "DESC" }
                });

                await examQuestionRepo.save(examQuestionRepo.create({
                    examId: data.examId,
                    questionId: savedQuestion.id,
                    orderIndex: last ? last.orderIndex + 1 : 1
                }));
            }

            const createdQuestion = await questionRepo.findOne({
                where: { id: savedQuestion.id },
                relations: { options: true }
            });

            return this.toSafeQuestion(createdQuestion);
        });
    }
    async getAllQuestion() {
        const result = await this.questionRepository.find({
            relations: {
                options: true
            }
        });
        return result.map(question => this.toSafeQuestion(question));
    }

    async getQuestionDetail(questionId: number) {
        const result = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: {
                options: true
            }
        })
        if (!result) {
            throw new AppError("Question not found", 404);
        }
        return this.toSafeQuestion(result);
    }

    async getDictationQuestion(questionId: number) {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: {
                options: true
            }
        });

        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Dictation question not found", 404);
        }

        return this.toSafeQuestion(question);
    }

    async submitDictationAnswer(questionId: number, answers: string[]) {
        if (!Array.isArray(answers)) {
            throw new AppError("answers must be an array", 400);
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Dictation question not found", 404);
        }

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        if (correctAnswers.length === 0) {
            throw new AppError("Dictation answer is not configured", 400);
        }

        const normalizedUserAnswers = answers.map(answer =>
            this.normalizeDictationAnswer(String(answer ?? ""))
        );
        const normalizedCorrectAnswers = correctAnswers.map(answer =>
            this.normalizeDictationAnswer(answer)
        );
        const isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length
            && normalizedCorrectAnswers.every((answer, index) => normalizedUserAnswers[index] === answer);

        return {
            isCorrect,
            correctAnswers,
            transcript: question.transcript
        };
    }

    async updateQuestion(
        questionId: number,
        data: {
            type?: QuestionType;
            content?: string;
            explanation?: string;
            audioUrl?: string | null;
            audioFileName?: string | null;
            audioDuration?: number | null;
            transcript?: string | null;
            showTranscript?: boolean;
            dictationAnswer?: string | null;
            options?: {
                label: string;
                content: string;
                isCorrect: boolean;
            }[];
        }
    ) {
        return AppDataSource.transaction(async (manager) => {
            const questionRepo = manager.getRepository(Question);
            const optionRepo = manager.getRepository(QuestionOption);

            const question = await questionRepo.findOne({
                where: { id: questionId },
                relations: {
                    options: true
                }
            });

            if (!question) {
                throw new AppError("Question not found", 404);
            }

            const nextType = data.type ?? question.type;
            const nextContent = nextType === QuestionType.DICTATION
                ? data.transcript ?? question.transcript ?? data.content ?? question.content
                : data.content ?? question.content;

            if (nextType === QuestionType.SINGLE_CHOICE && (!nextContent || nextContent.trim() === "")) {
                throw new AppError("Question content is required", 400);
            }

            if (nextType === QuestionType.SINGLE_CHOICE) {
                if (!data.options || data.options.length < 2) {
                    throw new AppError("At least 2 options required", 400);
                }

                const correctCount = data.options.filter((option) => option.isCorrect).length;
                if (correctCount !== 1) {
                    throw new AppError("Must have exactly 1 correct answer", 400);
                }
            }

            if (nextType === QuestionType.DICTATION) {
                const nextDictationAnswer = data.dictationAnswer ?? question.dictationAnswer;
                const nextTranscript = data.transcript ?? question.transcript;
                if (!nextDictationAnswer?.trim()) {
                    throw new AppError("Dictation answer is required", 400);
                }
                if (!nextTranscript?.trim()) {
                    throw new AppError("Transcript is required for dictation", 400);
                }
            }

            question.type = nextType;
            question.content = nextType === QuestionType.DICTATION
                ? (data.transcript ?? nextContent)?.trim() ?? null
                : nextContent?.trim() ?? null;
            question.explanation = data.explanation ?? question.explanation;
            question.audioUrl = data.audioUrl === undefined ? question.audioUrl : data.audioUrl;
            question.audioFileName =
                data.audioFileName === undefined ? question.audioFileName : data.audioFileName;
            question.transcript = data.transcript === undefined ? question.transcript : data.transcript;
            question.showTranscript = data.showTranscript ?? question.showTranscript;
            question.dictationAnswer =
                nextType === QuestionType.DICTATION
                    ? (data.dictationAnswer ?? question.dictationAnswer)?.trim() ?? null
                    : null;

            const savedQuestion = await questionRepo.save(question);

            if (nextType === QuestionType.SINGLE_CHOICE) {
                await optionRepo.delete({ questionId });
                const options = data.options!.map((option) =>
                    optionRepo.create({
                        questionId,
                        label: option.label.toUpperCase(),
                        content: option.content,
                        isCorrect: option.isCorrect,
                    })
                );
                await optionRepo.save(options);
            } else {
                await optionRepo.delete({ questionId });
            }

            const updatedQuestion = await questionRepo.findOne({
                where: { id: savedQuestion.id },
                relations: {
                    options: true
                }
            });

            return this.toSafeQuestion(updatedQuestion);
        });
    }

    async deleteQuestion(questionId: number) {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question) {
            throw new AppError("Question not found", 404);
        }

        await this.questionRepository.delete(questionId);
    }
}
