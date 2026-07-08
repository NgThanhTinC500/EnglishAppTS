import { AppDataSource } from "../data-source";
import { Question, QuestionCategory, QuestionType } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";

import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import { AppError } from "../utils/appError";

export class QuestionService {
    private questionRepository = AppDataSource.getRepository(Question);
    private examRepository = AppDataSource.getRepository(Exam);
    private examQuestionRepository = AppDataSource.getRepository(ExamQuestion);

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",")
            .map(answer => answer.trim())
            .filter(Boolean);
    }

    private normalizeDictationAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

    private maskTranscript(transcript: string | null, correctAnswers: string[]) {
        if (!transcript) return transcript;
        if (transcript.includes("[BLANK]")) return transcript;

        return correctAnswers.reduce((maskedTranscript, answer) => {
            if (!answer) return maskedTranscript;
            const escapedAnswer = this.escapeRegExp(answer);
            const pattern = new RegExp(`(^|[\\s.,!?;:"'()])(${escapedAnswer})(?=$|[\\s.,!?;:"'()])`, "i");

            return maskedTranscript.replace(pattern, (_match, prefix) => `${prefix}[BLANK]`);
        }, transcript);
    }

    private validateQuestionType(value: QuestionType) {
        if (!Object.values(QuestionType).includes(value)) {
            throw new AppError("Kiểu question type không hợp lệ", 400);
        }
    }

    private validateQuestionCategory(value: QuestionCategory) {
        if (!Object.values(QuestionCategory).includes(value)) {
            throw new AppError("Loại câu hỏi không hợp lệ", 400);
        }
    }

    private getDefaultCategoryByType(questionType: QuestionType) {
        if (questionType === QuestionType.DICTATION) {
            return QuestionCategory.LISTENING;
        }

        return QuestionCategory.GRAMMAR;
    }

    private ensureQuestionTypeMatchesCategory(
        questionType: QuestionType,
        questionCategory: QuestionCategory
    ) {
        if (
            questionType === QuestionType.DICTATION &&
            questionCategory !== QuestionCategory.LISTENING
        ) {
            throw new AppError("Câu hỏi dictation phải thuộc loại listening", 400);
        }
    }

    private ensureCategoryMatchesTopic(
        topicType: string | null | undefined,
        questionCategory: QuestionCategory
    ) {
        if (!topicType) {
            throw new AppError("Đề tài không được cấu hình", 400);
        }

        if (topicType !== questionCategory) {
            throw new AppError(
                `Loại câu hỏi phải khớp với loại đề tài. Dự kiến "${topicType}", nhận được "${questionCategory}"`,
                400
            );
        }
    }

    private ensureCategoryMatchesLinkedTopics(
        linkedExamQuestions: ExamQuestion[],
        questionCategory: QuestionCategory
    ) {
        const invalidLink = linkedExamQuestions.find(
            (item) => String(item.exam?.topic?.type ?? "") !== questionCategory
        );

        if (invalidLink) {
            this.ensureCategoryMatchesTopic(
                invalidLink.exam?.topic?.type,
                questionCategory
            );
        }
    }

    private normalizeOptionIsCorrect(value: boolean | string) {
        if (typeof value === "boolean") return value;

        if (typeof value === "string") {
            const normalizedValue = value.trim().toLowerCase();
            if (normalizedValue === "true") return true;
            if (normalizedValue === "false") return false;
        }

        throw new AppError("isCorrect phải là boolean", 400);
    }

    private normalizeSingleChoiceOptions(options: {
        label: string;
        content: string;
        isCorrect: boolean | string;
    }[]) {
        if (!Array.isArray(options)) return options;

        return options.map((option) => ({
            ...option,
            isCorrect: this.normalizeOptionIsCorrect(option.isCorrect),
        }));
    }

    private validateSingleChoiceOptions(options: {
        label: string;
        content: string;
        isCorrect: boolean;
    }[]) {
        if (!Array.isArray(options) || options.length < 2) {
            throw new AppError("Ít nhất 2 tùy chọn được yêu cầu", 400);
        }
        const hasInvalidOption = options.some(
            (option) => !option.label?.trim() || !option.content?.trim()
        );
        if (hasInvalidOption) {
            throw new AppError("Thẻ tùy chọn và nội dung là bắt buộc", 400);
        }
        const correctCount = options.filter((option) => option.isCorrect).length;
        if (correctCount !== 1) {
            throw new AppError("Phải có đúng 1 đáp án đúng", 400);
        }
    }


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
            isCorrect: boolean | string;
        }[];
        examId?: number;
    }) {
        return AppDataSource.transaction(async (manager) => {
            const questionRepo = manager.getRepository(Question);
            const optionRepo = manager.getRepository(QuestionOption);
            const examRepo = manager.getRepository(Exam);
            const examQuestionRepo = manager.getRepository(ExamQuestion);
            const questionType = data.type ?? QuestionType.SINGLE_CHOICE;
            const questionCategory = data.category ?? this.getDefaultCategoryByType(questionType);
            const normalizedOptions = questionType === QuestionType.SINGLE_CHOICE
                ? this.normalizeSingleChoiceOptions(data.options ?? [])
                : [];
            this.validateQuestionType(questionType);
            this.validateQuestionCategory(questionCategory);
            this.ensureQuestionTypeMatchesCategory(questionType, questionCategory);

            let targetExamId: number | null = null;
            if (data.examId !== undefined) {
                targetExamId = Number(data.examId);
                this.ensurePositiveInteger(targetExamId, "examId");

                const exam = await examRepo.findOne({
                    where: { id: targetExamId },
                    relations: { topic: true }
                });
                if (!exam) throw new AppError("Exam not found", 404);

                this.ensureCategoryMatchesTopic(
                    exam.topic?.type,
                    questionCategory
                );
            }

            if (questionType === QuestionType.SINGLE_CHOICE) {
                if (!data.content || data.content.trim() === "") {
                    throw new AppError("Phải có nội dung câu hỏi", 400);
                }
                this.validateSingleChoiceOptions(normalizedOptions);
            }
            if (questionType === QuestionType.DICTATION) {
                if (!data.dictationAnswer?.trim()) {
                    throw new AppError("Phải có đáp án dictation", 400);
                }
                if (!data.audioUrl) {
                    throw new AppError("Phải có tệp âm thanh cho dictation", 400);
                }
                if (!data.transcript?.trim()) {
                    throw new AppError("Transcript phải có cho dictation", 400);
                }
            }

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

            if (questionType === QuestionType.SINGLE_CHOICE && normalizedOptions.length > 0) {
                const options = normalizedOptions.map(opt =>
                    optionRepo.create({
                        questionId: savedQuestion.id,
                        label: opt.label.trim().toUpperCase(),
                        content: opt.content.trim(),
                        isCorrect: opt.isCorrect,
                    })
                );
                await optionRepo.save(options);
            }

            if (targetExamId !== null) {
                const last = await examQuestionRepo.findOne({
                    where: { examId: targetExamId },
                    order: { orderIndex: "DESC" }
                });

                await examQuestionRepo.save(examQuestionRepo.create({
                    examId: targetExamId,
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
            throw new AppError("Câu hỏi không tìm thấy", 404);
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
            throw new AppError("Câu hỏi dictation không tìm thấy", 404);
        }

        return this.toSafeQuestion(question);
    }

    async submitDictationAnswer(questionId: number, answers: string[]) {
        if (!Array.isArray(answers)) {
            throw new AppError("Đáp án phải là một mảng", 400);
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Câu hỏi dictation không tìm thấy", 404);
        }

        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        if (correctAnswers.length === 0) {
            throw new AppError("Đáp án dictation không được cấu hình", 400);
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
            category?: QuestionCategory;
            content?: string;
            explanation?: string;
            audioUrl?: string | null;
            audioFileName?: string | null;
            transcript?: string | null;
            showTranscript?: boolean;
            dictationAnswer?: string | null;
            options?: {
                label: string;
                content: string;
                isCorrect: boolean | string;
            }[];
        }
    ) {
        return AppDataSource.transaction(async (manager) => {
            const questionRepo = manager.getRepository(Question);
            const optionRepo = manager.getRepository(QuestionOption);
            const examQuestionRepo = manager.getRepository(ExamQuestion);

            const question = await questionRepo.findOne({
                where: { id: questionId },
                relations: {
                    options: true
                }
            });

            if (!question) {
                throw new AppError("Câu hỏi không tìm thấy", 404);
            }

            const nextType = data.type ?? question.type;
            const nextCategory = data.category ?? question.category;
            this.validateQuestionType(nextType);
            this.validateQuestionCategory(nextCategory);
            this.ensureQuestionTypeMatchesCategory(nextType, nextCategory);

            const linkedExamQuestions = await examQuestionRepo.find({
                where: { questionId },
                relations: {
                    exam: {
                        topic: true
                    }
                }
            });
            this.ensureCategoryMatchesLinkedTopics(
                linkedExamQuestions,
                nextCategory
            );

            const nextContent = nextType === QuestionType.DICTATION
                ? data.transcript ?? question.transcript ?? data.content ?? question.content
                : data.content ?? question.content;
            const nextOptions = data.options !== undefined
                ? this.normalizeSingleChoiceOptions(data.options)
                : question.options ?? [];

            if (nextType === QuestionType.SINGLE_CHOICE && (!nextContent || nextContent.trim() === "")) {
                throw new AppError("Nội dung câu hỏi là bắt buộc", 400);
            }

            if (nextType === QuestionType.SINGLE_CHOICE) {
                this.validateSingleChoiceOptions(nextOptions);
            }

            if (nextType === QuestionType.DICTATION) {
                const nextDictationAnswer = data.dictationAnswer ?? question.dictationAnswer;
                const nextTranscript = data.transcript ?? question.transcript;
                const nextAudioUrl = data.audioUrl === undefined ? question.audioUrl : data.audioUrl;
                if (!nextDictationAnswer?.trim()) {
                    throw new AppError("Đáp án dictation là bắt buộc", 400);
                }
                if (!nextTranscript?.trim()) {
                    throw new AppError("Transcript là bắt buộc cho dictation", 400);
                }
                if (!nextAudioUrl) {
                    throw new AppError("Tệp âm thanh là bắt buộc cho dictation", 400);
                }
            }

            question.type = nextType;
            question.category = nextCategory;
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
                if (data.options) {
                    await optionRepo.delete({ questionId });
                    const options = nextOptions.map((option) =>
                        optionRepo.create({
                            questionId,
                            label: option.label.trim().toUpperCase(),
                            content: option.content.trim(),
                            isCorrect: option.isCorrect,
                        })
                    );
                    await optionRepo.save(options);
                }
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
            throw new AppError("Câu hỏi không tìm thấy", 404);
        }

        await this.questionRepository.delete(questionId);
    }
}
