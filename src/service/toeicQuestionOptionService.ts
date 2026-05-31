import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { ToeicQuestionOption } from "../entity/ToeicQuestionOption";
import { AppError } from "../utils/appError";

export class ToeicQuestionOptionService {
    private toeicQuestionOptionRepository: Repository<ToeicQuestionOption>;
    private toeicQuestionRepository: Repository<ToeicQuestion>;

    constructor() {
        this.toeicQuestionOptionRepository = AppDataSource.getRepository(ToeicQuestionOption);
        this.toeicQuestionRepository = AppDataSource.getRepository(ToeicQuestion);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private async ensureQuestionExists(questionId: number) {
        this.ensurePositiveInteger(questionId, "questionId");

        const question = await this.toeicQuestionRepository.findOne({
            where: { id: questionId },
        });

        if (!question) throw new AppError("Toeic question not found", 404);

        return question;
    }

    async getAllByQuestion(questionId: number) {
        await this.ensureQuestionExists(questionId);

        return this.toeicQuestionOptionRepository.find({
            where: { questionId },
            order: { optionLabel: "ASC" },
        });
    }

    async getById(id: number) {
        this.ensurePositiveInteger(id, "id");

        const option = await this.toeicQuestionOptionRepository.findOne({
            where: { id },
        });

        if (!option) throw new AppError("Toeic question option not found", 404);

        return option;
    }

    async create(questionId: number, data: Partial<ToeicQuestionOption>) {
        await this.ensureQuestionExists(questionId);

        if (data.optionLabel === undefined) {
            throw new AppError("optionLabel is required", 400);
        }

        if (!data.contentEn?.trim()) {
            throw new AppError("contentEn is required", 400);
        }

        const optionCount = await this.toeicQuestionOptionRepository.count({
            where: { questionId },
        });

        if (optionCount >= 4) {
            throw new AppError("Question already has 4 options", 400);
        }

        const existingOption = await this.toeicQuestionOptionRepository.findOne({
            where: {
                questionId,
                optionLabel: data.optionLabel,
            },
            withDeleted: true,
        });

        if (existingOption) {
            throw new AppError("Option label already exists in this question", 400);
        }

        return AppDataSource.transaction(async (manager) => {
            const optionRepository = manager.getRepository(ToeicQuestionOption);
            const questionRepository = manager.getRepository(ToeicQuestion);

            const option = optionRepository.create({
                questionId,
                optionLabel: data.optionLabel,
                contentEn: data.contentEn!.trim(),
                contentVi: data.contentVi ?? null,
                isCorrect: data.isCorrect ?? false,
            });

            const savedOption = await optionRepository.save(option);

            if (savedOption.isCorrect) {
                await optionRepository.update(
                    { questionId },
                    { isCorrect: false }
                );
                savedOption.isCorrect = true;
                await optionRepository.save(savedOption);
                await questionRepository.update(questionId, {
                    correctOptionId: savedOption.id,
                });
            }

            return savedOption;
        });
    }

    async update(id: number, data: Partial<ToeicQuestionOption>) {
        this.ensurePositiveInteger(id, "id");

        const option = await this.toeicQuestionOptionRepository.findOne({
            where: { id },
        });

        if (!option) throw new AppError("Toeic question option not found", 404);

        return AppDataSource.transaction(async (manager) => {
            const optionRepository = manager.getRepository(ToeicQuestionOption);
            const questionRepository = manager.getRepository(ToeicQuestion);

            const currentOption = await optionRepository.findOne({
                where: { id },
            });

            if (!currentOption) throw new AppError("Toeic question option not found", 404);

            const question = await questionRepository.findOne({
                where: { id: currentOption.questionId },
            });

            if (!question) throw new AppError("Toeic question not found", 404);

            if (data.contentEn !== undefined) {
                if (!data.contentEn.trim()) throw new AppError("contentEn is required", 400);
                currentOption.contentEn = data.contentEn.trim();
            }

            if (data.contentVi !== undefined) {
                currentOption.contentVi = data.contentVi;
            }

            if (data.isCorrect !== undefined) {
                currentOption.isCorrect = data.isCorrect;

                if (data.isCorrect) {
                    await optionRepository.update(
                        { questionId: currentOption.questionId },
                        { isCorrect: false }
                    );
                    currentOption.isCorrect = true;
                    question.correctOptionId = currentOption.id;
                } else if (question.correctOptionId === currentOption.id) {
                    question.correctOptionId = null;
                }
            }

            const savedOption = await optionRepository.save(currentOption);
            await questionRepository.save(question);

            return savedOption;
        });
    }

    async softDelete(id: number) {
        this.ensurePositiveInteger(id, "id");

        const option = await this.toeicQuestionOptionRepository.findOne({
            where: { id },
        });

        if (!option) throw new AppError("Toeic question option not found", 404);

        await AppDataSource.transaction(async (manager) => {
            const optionRepository = manager.getRepository(ToeicQuestionOption);
            const questionRepository = manager.getRepository(ToeicQuestion);

            const currentOption = await optionRepository.findOne({
                where: { id },
            });

            if (!currentOption) throw new AppError("Toeic question option not found", 404);

            const question = await questionRepository.findOne({
                where: { id: currentOption.questionId },
            });

            if (question?.correctOptionId === currentOption.id) {
                question.correctOptionId = null;
                await questionRepository.save(question);
            }

            await optionRepository.softDelete(id);
        });
    }
}
