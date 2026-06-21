import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { ToeicQuestionGroup } from "../entity/ToeicQuestionGroup";
import { ToeicQuestionOption, ToeicOptionLabel } from "../entity/ToeicQuestionOption";
import { AppError } from "../utils/appError";

interface CreateQuestionOptionInput {
    id?: number;
    optionLabel: ToeicOptionLabel;
    content?: string;
    isCorrect?: boolean;
}

interface CreateQuestionInput {
    questionNumber: number;
    content?: string | null;
    explanation?: string | null;
    options: CreateQuestionOptionInput[];
}

interface UpdateQuestionWithOptionsInput extends Partial<CreateQuestionInput> {
    options: CreateQuestionOptionInput[];
}

export class ToeicQuestionService {
    private toeicQuestionRepository: Repository<ToeicQuestion>;
    private toeicQuestionGroupRepository: Repository<ToeicQuestionGroup>;

    constructor() {
        this.toeicQuestionRepository = AppDataSource.getRepository(ToeicQuestion);
        this.toeicQuestionGroupRepository = AppDataSource.getRepository(ToeicQuestionGroup);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private validateOptions(options: CreateQuestionOptionInput[]) {
        if (!Array.isArray(options) || options.length === 0) {
            throw new AppError("options must be a non-empty array", 400);
        }

        if (options.length > 4) {
            throw new AppError("options cannot exceed 4 items", 400);
        }

        const labels = new Set<string>();
        let correctCount = 0;

        options.forEach((option, index) => {
            // Validate optionLabel
            if (!option.optionLabel || !Object.values(ToeicOptionLabel).includes(option.optionLabel)) {
                throw new AppError(
                    `Option at index ${index} has invalid optionLabel. Must be A, B, C, or D`,
                    400
                );
            }

            if (labels.has(option.optionLabel)) {
                throw new AppError(
                    `Duplicate optionLabel ${option.optionLabel}`,
                    400
                );
            }

            labels.add(option.optionLabel);

            // Count correct options
            if (option.isCorrect) {
                correctCount++;
            }
        });

        // At least one option should be marked as correct
        if (correctCount === 0) {
            throw new AppError("At least one option must be marked as correct (isCorrect: true)", 400);
        }

        // Only one option should be correct
        if (correctCount > 1) {
            throw new AppError("Only one option can be marked as correct", 400);
        }
    }

    private async ensureQuestionGroupExists(questionGroupId: number) {
        this.ensurePositiveInteger(questionGroupId, "questionGroupId");

        const group = await this.toeicQuestionGroupRepository.findOne({
            where: { id: questionGroupId },
        });

        if (!group) throw new AppError("Toeic question group not found", 404);
    }

    async getAllByGroup(questionGroupId: number) {
        await this.ensureQuestionGroupExists(questionGroupId);

        return this.toeicQuestionRepository.find({
            where: { questionGroupId },
            relations: {
                options: true,
            },
            order: { questionNumber: "ASC" },
        });
    }

    async getById(id: number) {
        this.ensurePositiveInteger(id, "id");

        const question = await this.toeicQuestionRepository.findOne({
            where: { id },
            relations: {
                options: true,
            },
            order: {
                options: {
                    optionLabel: "ASC",
                },
            },
        });

        if (!question) throw new AppError("Toeic question not found", 404);

        return question;
    }

    async create(questionGroupId: number, data: CreateQuestionInput) {
        await this.ensureQuestionGroupExists(questionGroupId);

        if (data.questionNumber === undefined) {
            throw new AppError("questionNumber is required", 400);
        }
        this.ensurePositiveInteger(data.questionNumber, "questionNumber");

        // Validate options
        this.validateOptions(data.options);

        const existingQuestion = await this.toeicQuestionRepository.findOne({
            where: {
                questionGroupId,
                questionNumber: data.questionNumber,
            },
            withDeleted: true,
        });

        if (existingQuestion) {
            throw new AppError(`Câu số ${data.questionNumber} đã tồn tại trong nhóm này`, 400);
        }

        // Use transaction to ensure data consistency
        return AppDataSource.transaction(async (transactionalEntityManager) => {
            const question = transactionalEntityManager.create(ToeicQuestion, {
                questionGroupId,
                questionNumber: data.questionNumber,
                content: data.content ?? null,
                explanation: data.explanation ?? null,
            });

            const savedQuestion = await transactionalEntityManager.save(question);

            // Create options
            let correctOptionId: number | null = null;
            const optionsToCreate = data.options.map((option) =>
                transactionalEntityManager.create(ToeicQuestionOption, {
                    questionId: savedQuestion.id,
                    optionLabel: option.optionLabel,
                    content: option.content?.trim() ?? "",
                    isCorrect: option.isCorrect ?? false,
                })
            );

            const savedOptions = await transactionalEntityManager.save(optionsToCreate);

            // Find the correct option and set correctOptionId
            const correctOption = savedOptions.find((opt) => opt.isCorrect);
            if (correctOption) {
                correctOptionId = correctOption.id;
                savedQuestion.correctOptionId = correctOptionId;
                await transactionalEntityManager.save(savedQuestion);
            }

            // Reload question with options
            return transactionalEntityManager.findOne(ToeicQuestion, {
                where: { id: savedQuestion.id },
                relations: ["options"],
                order: {
                    options: {
                        optionLabel: "ASC",
                    },
                },
            });
        });
    }

    async updateWithOptions(id: number, data: UpdateQuestionWithOptionsInput) {
        this.ensurePositiveInteger(id, "id");
        this.validateOptions(data.options);

        const question = await this.toeicQuestionRepository.findOne({
            where: { id },
        });

        if (!question) throw new AppError("Toeic question not found", 404);

        if (data.questionNumber !== undefined) {
            this.ensurePositiveInteger(data.questionNumber, "questionNumber");

            const existingQuestion = await this.toeicQuestionRepository.findOne({
                where: {
                    questionGroupId: question.questionGroupId,
                    questionNumber: data.questionNumber,
                },
                withDeleted: true,
            });

            if (existingQuestion && existingQuestion.id !== question.id) {
                throw new AppError(`Câu số ${data.questionNumber} đã tồn tại trong nhóm này`, 400);
            }
        }

        return AppDataSource.transaction(async (manager) => {
            const questionRepository = manager.getRepository(ToeicQuestion);
            const optionRepository = manager.getRepository(ToeicQuestionOption);

            const currentQuestion = await questionRepository.findOne({
                where: { id },
            });

            if (!currentQuestion) throw new AppError("Toeic question not found", 404);

            if (data.questionNumber !== undefined) {
                currentQuestion.questionNumber = data.questionNumber;
            }

            if (data.content !== undefined) {
                currentQuestion.content = data.content;
            }

            if (data.explanation !== undefined) {
                currentQuestion.explanation = data.explanation;
            }

            await optionRepository.update(
                { questionId: id },
                { isCorrect: false }
            );

            let correctOptionId: number | null = null;
            const retainedOptionIds = new Set<number>();

            for (const optionInput of data.options) {
                const existingOption = optionInput.id
                    ? await optionRepository.findOne({
                        where: {
                            id: optionInput.id,
                            questionId: id,
                        },
                    })
                    : await optionRepository.findOne({
                        where: {
                            questionId: id,
                            optionLabel: optionInput.optionLabel,
                        },
                    });

                if (optionInput.id && !existingOption) {
                    throw new AppError("Toeic question option not found", 404);
                }

                const option = existingOption ?? optionRepository.create({
                    questionId: id,
                    optionLabel: optionInput.optionLabel,
                });

                option.optionLabel = optionInput.optionLabel;
                option.content = optionInput.content?.trim() ?? "";
                option.isCorrect = optionInput.isCorrect === true;

                const savedOption = await optionRepository.save(option);
                retainedOptionIds.add(savedOption.id);

                if (savedOption.isCorrect) {
                    correctOptionId = savedOption.id;
                }
            }

            const existingOptions = await optionRepository.find({
                where: { questionId: id },
            });

            const removedOptionIds = existingOptions
                .filter((option) => !retainedOptionIds.has(option.id))
                .map((option) => option.id);

            if (removedOptionIds.length > 0) {
                await optionRepository.delete(removedOptionIds);
            }

            if (!correctOptionId) {
                throw new AppError("Câu hỏi phải có đúng một lựa chọn đúng", 400);
            }

            currentQuestion.correctOptionId = correctOptionId;
            await questionRepository.save(currentQuestion);

            return questionRepository.findOne({
                where: { id },
                relations: {
                    options: true,
                },
                order: {
                    options: {
                        optionLabel: "ASC",
                    },
                },
            });
        });
    }

    async softDelete(id: number) {
        this.ensurePositiveInteger(id, "id");

        const question = await this.toeicQuestionRepository.findOne({
            where: { id },
        });

        if (!question) throw new AppError("Toeic question not found", 404);

        await this.toeicQuestionRepository.softDelete(id);
    }
}
