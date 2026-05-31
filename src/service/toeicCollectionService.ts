import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicCollection } from "../entity/ToeicCollection";
import { AppError } from "../utils/appError";

export class ToeicCollectionService {
    private toeicCollectionRepository: Repository<ToeicCollection>;

    constructor() {
        this.toeicCollectionRepository = AppDataSource.getRepository(ToeicCollection);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    async getAllToeicCollections() {
        return this.toeicCollectionRepository.find({
            order: { createdAt: "DESC" },
        });
    }

    async getToeicCollectionById(collectionId: number) {
        this.ensurePositiveInteger(collectionId, "collectionId");

        const collection = await this.toeicCollectionRepository.findOne({
            where: { id: collectionId },
        });

        if (!collection) throw new AppError("Toeic collection not found", 404);

        return collection;
    }

    async createToeicCollection(collectionData: Partial<ToeicCollection>) {
        if (!collectionData.title?.trim()) {
            throw new AppError("Title is required", 400);
        }

        const collection = this.toeicCollectionRepository.create({
            title: collectionData.title.trim(),
            isPublished: collectionData.isPublished ?? false,
        });

        return this.toeicCollectionRepository.save(collection);
    }

    async updateToeicCollection(collectionId: number, collectionData: Partial<ToeicCollection>) {
        this.ensurePositiveInteger(collectionId, "collectionId");

        const collection = await this.toeicCollectionRepository.findOne({
            where: { id: collectionId },
        });

        if (!collection) throw new AppError("Toeic collection not found", 404);

        if (collectionData.title !== undefined) {
            if (!collectionData.title.trim()) throw new AppError("Title is required", 400);
            collection.title = collectionData.title.trim();
        }

        if (collectionData.isPublished !== undefined) {
            collection.isPublished = collectionData.isPublished;
        }

        return this.toeicCollectionRepository.save(collection);
    }

    async deleteToeicCollection(collectionId: number) {
        this.ensurePositiveInteger(collectionId, "collectionId");

        const collection = await this.toeicCollectionRepository.findOne({
            where: { id: collectionId },
        });

        if (!collection) throw new AppError("Toeic collection not found", 404);

        await this.toeicCollectionRepository.softDelete(collectionId);
    }
}
