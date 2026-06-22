import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicExamPart } from "../entity/ToeicExamPart";
import { ToeicQuestionGroup } from "../entity/ToeicQuestionGroup";
import { ToeicQuestionGroupImage } from "../entity/ToeicQuestionGroupImage";
import { AppError } from "../utils/appError";

interface CreateGroupImageInput {
    imageOrder: number;
    imageUrl: string;
    translationVi?: string | null;
}

interface CreateGroupInput {
    audioUrl?: string | null;
    audioDurationSeconds?: number | null;
    explanation?: string | null;
    images?: CreateGroupImageInput[];
}

interface UpdateGroupMediaInput {
    audioUrl?: string;
    imageUrls?: string[];
}

export class ToeicQuestionGroupService {
    private toeicQuestionGroupRepository: Repository<ToeicQuestionGroup>;
    private toeicExamPartRepository: Repository<ToeicExamPart>;
    private toeicQuestionGroupImageRepository: Repository<ToeicQuestionGroupImage>;

    constructor() {
        this.toeicQuestionGroupRepository = AppDataSource.getRepository(ToeicQuestionGroup);
        this.toeicExamPartRepository = AppDataSource.getRepository(ToeicExamPart);
        this.toeicQuestionGroupImageRepository = AppDataSource.getRepository(ToeicQuestionGroupImage);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private async getNextGroupOrder(examPartId: number) {
        const result = await this.toeicQuestionGroupRepository
            .createQueryBuilder("group")
            .withDeleted()
            .select("COALESCE(MAX(group.groupOrder), 0)", "maxGroupOrder")
            .where("group.examPartId = :examPartId", { examPartId })
            .getRawOne<{ maxGroupOrder: string | number | null }>();

        return Number(result?.maxGroupOrder ?? 0) + 1;
    }

    private validateImages(images: CreateGroupImageInput[]) {
        if (!Array.isArray(images)) {
            throw new AppError("images must be an array", 400);
        }

        const imageOrders = new Set<number>();

        images.forEach((image, index) => {
            if (!image.imageUrl || image.imageUrl.trim() === "") {
                throw new AppError(
                    `Image at index ${index} must have imageUrl`,
                    400
                );
            }

            if (image.imageOrder === undefined) {
                throw new AppError(
                    `Image at index ${index} must have imageOrder`,
                    400
                );
            }

            this.ensurePositiveInteger(image.imageOrder, `images[${index}].imageOrder`);

            if (imageOrders.has(image.imageOrder)) {
                throw new AppError(
                    `Duplicate imageOrder ${image.imageOrder}`,
                    400
                );
            }

            imageOrders.add(image.imageOrder);
        });
    }

    private async ensureExamPartExists(examPartId: number) {
        this.ensurePositiveInteger(examPartId, "examPartId");

        const part = await this.toeicExamPartRepository.findOne({
            where: { id: examPartId },
        });

        if (!part) throw new AppError("Toeic exam part not found", 404);
    }

    async getAllByPart(examPartId: number) {
        await this.ensureExamPartExists(examPartId);

        return this.toeicQuestionGroupRepository.find({
            where: { examPartId },
            relations: {
                images: true,
                questions: true,
            },
            order: { groupOrder: "ASC" },
        });
    }

    async getById(id: number) {
        this.ensurePositiveInteger(id, "id");

        const group = await this.toeicQuestionGroupRepository.findOne({
            where: { id },
            relations: {
                images: true,
                questions: {
                    options: true,
                },
            },
            order: {
                images: {
                    imageOrder: "ASC",
                },
                questions: {
                    questionNumber: "ASC",
                    options: {
                        optionLabel: "ASC",
                    },
                },
            },
        });

        if (!group) throw new AppError("Toeic question group not found", 404);

        return group;
    }

    async create(examPartId: number, data: CreateGroupInput) {
        await this.ensureExamPartExists(examPartId);
        const groupOrder = await this.getNextGroupOrder(examPartId);

        // Validate images if provided
        if (data.images && data.images.length > 0) {
            this.validateImages(data.images);
        }

        // Use transaction to ensure data consistency
        return AppDataSource.transaction(async (transactionalEntityManager) => {
            const group = transactionalEntityManager.create(ToeicQuestionGroup, {
                examPartId,
                groupOrder,
                audioUrl: data.audioUrl ?? null,
                audioDurationSeconds: data.audioDurationSeconds ?? null,
                explanation: data.explanation ?? null,
            });

            const savedGroup = await transactionalEntityManager.save(group);

            // Create images if provided
            if (data.images && data.images.length > 0) {
                const imagesToCreate = data.images.map((image) =>
                    transactionalEntityManager.create(ToeicQuestionGroupImage, {
                        questionGroupId: savedGroup.id,
                        imageOrder: image.imageOrder,
                        imageUrl: image.imageUrl,
                        translationVi: image.translationVi ?? null,
                    })
                );

                await transactionalEntityManager.save(imagesToCreate);

                // Reload group with images
                return transactionalEntityManager.findOne(ToeicQuestionGroup, {
                    where: { id: savedGroup.id },
                    relations: ["images"],
                });
            }

            return savedGroup;
        });
    }

    async update(id: number, data: Partial<ToeicQuestionGroup>) {
        this.ensurePositiveInteger(id, "id");

        const group = await this.toeicQuestionGroupRepository.findOne({
            where: { id },
        });

        if (!group) throw new AppError("Toeic question group not found", 404);

        if (data.audioUrl !== undefined) {
            group.audioUrl = data.audioUrl;
        }

        if (data.audioDurationSeconds !== undefined) {
            group.audioDurationSeconds = data.audioDurationSeconds;
        }

        if (data.explanation !== undefined) {
            group.explanation = data.explanation;
        }

        return this.toeicQuestionGroupRepository.save(group);
    }

    async updateMedia(id: number, data: UpdateGroupMediaInput) {
        this.ensurePositiveInteger(id, "id");

        const group = await this.toeicQuestionGroupRepository.findOne({
            where: { id },
            relations: {
                images: true,
            },
        });

        if (!group) throw new AppError("Toeic question group not found", 404);
        if (!data.audioUrl && !data.imageUrls?.length) {
            throw new AppError("At least one audio or image file is required", 400);
        }

        return AppDataSource.transaction(async (manager) => {
            if (data.audioUrl) {
                group.audioUrl = data.audioUrl;
                await manager.save(group);
            }

            if (data.imageUrls?.length) {
                const currentMaxOrder = group.images?.reduce(
                    (maxOrder, image) => Math.max(maxOrder, image.imageOrder),
                    0
                ) ?? 0;

                const images = data.imageUrls.map((imageUrl, index) =>
                    manager.create(ToeicQuestionGroupImage, {
                        questionGroupId: id,
                        imageOrder: currentMaxOrder + index + 1,
                        imageUrl,
                        translationVi: null,
                    })
                );

                await manager.save(images);
            }

            return manager.findOne(ToeicQuestionGroup, {
                where: { id },
                relations: {
                    images: true,
                },
                order: {
                    images: {
                        imageOrder: "ASC",
                    },
                },
            });
        });
    }

    async softDelete(id: number) {
        this.ensurePositiveInteger(id, "id");

        const group = await this.toeicQuestionGroupRepository.findOne({
            where: { id },
        });

        if (!group) throw new AppError("Toeic question group not found", 404);

        await this.toeicQuestionGroupRepository.softDelete(id);
    }
}
