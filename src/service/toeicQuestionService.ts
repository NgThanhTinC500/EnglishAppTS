import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { ToeicQuestionGroup } from "../entity/ToeicQuestionGroup";
import { ToeicQuestionOption, ToeicOptionLabel } from "../entity/ToeicQuestionOption";
import { AppError } from "../utils/appError";

interface CreateQuestionOptionInput {
    optionLabel: ToeicOptionLabel;
    contentEn: string;
    contentVi?: string | null;
    isCorrect?: boolean;
}

interface CreateQuestionInput {
    questionNumber: number;
    contentEn?: string | null;
    contentVi?: string | null;
    explanationVi?: string | null;
    options: CreateQuestionOptionInput[];
}

export class ToeicQuestionService {
    private toeicQuestionRepository: Repository<ToeicQuestion>;
    private toeicQuestionGroupRepository: Repository<ToeicQuestionGroup>;
    private toeicQuestionOptionRepository: Repository<ToeicQuestionOption>;

    constructor() {
        this.toeicQuestionRepository = AppDataSource.getRepository(ToeicQuestion);
        this.toeicQuestionGroupRepository = AppDataSource.getRepository(ToeicQuestionGroup);
        this.toeicQuestionOptionRepository = AppDataSource.getRepository(ToeicQuestionOption);
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

            // Validate contentEn
            if (!option.contentEn || option.contentEn.trim() === "") {
                throw new AppError(
                    `Option at index ${index} (${option.optionLabel}) must have contentEn`,
                    400
                );
            }

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
            throw new AppError("Question number already exists in this group", 400);
        }

        // Use transaction to ensure data consistency
        return AppDataSource.transaction(async (transactionalEntityManager) => {
            const question = transactionalEntityManager.create(ToeicQuestion, {
                questionGroupId,
                questionNumber: data.questionNumber,
                contentEn: data.contentEn ?? null,
                contentVi: data.contentVi ?? null,
                explanationVi: data.explanationVi ?? null,
            });

            const savedQuestion = await transactionalEntityManager.save(question);

            // Create options
            let correctOptionId: number | null = null;
            const optionsToCreate = data.options.map((option) =>
                transactionalEntityManager.create(ToeicQuestionOption, {
                    questionId: savedQuestion.id,
                    optionLabel: option.optionLabel,
                    contentEn: option.contentEn,
                    contentVi: option.contentVi ?? null,
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

    async update(id: number, data: Partial<ToeicQuestion>) {
        this.ensurePositiveInteger(id, "id");

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
                throw new AppError("Question number already exists in this group", 400);
            }

            question.questionNumber = data.questionNumber;
        }

        if (data.contentEn !== undefined) {
            question.contentEn = data.contentEn;
        }

        if (data.contentVi !== undefined) {
            question.contentVi = data.contentVi;
        }

        if (data.explanationVi !== undefined) {
            question.explanationVi = data.explanationVi;
        }

        return this.toeicQuestionRepository.save(question);
    }

    async setCorrectOption(id: number, correctOptionId: number) {
        this.ensurePositiveInteger(id, "id");
        this.ensurePositiveInteger(correctOptionId, "correctOptionId");

        const question = await this.toeicQuestionRepository.findOne({
            where: { id },
        });

        if (!question) throw new AppError("Toeic question not found", 404);

        const option = await this.toeicQuestionOptionRepository.findOne({
            where: {
                id: correctOptionId,
                questionId: id,
            },
        });

        if (!option) throw new AppError("Toeic question option not found", 404);

        return AppDataSource.transaction(async (manager) => {
            await manager.update(
                ToeicQuestionOption,
                { questionId: id },
                { isCorrect: false }
            );

            await manager.update(
                ToeicQuestionOption,
                { id: correctOptionId },
                { isCorrect: true }
            );

            question.correctOptionId = correctOptionId;
            await manager.save(question);

            return manager.findOne(ToeicQuestion, {
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
