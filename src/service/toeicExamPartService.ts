import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicExamPart } from "../entity/ToeicExamPart";
import { ToeicExamSet } from "../entity/ToeicExamSet";
import { AppError } from "../utils/appError";

export class ToeicExamPartService {
    private toeicExamPartRepository: Repository<ToeicExamPart>;
    private toeicExamSetRepository: Repository<ToeicExamSet>;

    constructor() {
        this.toeicExamPartRepository = AppDataSource.getRepository(ToeicExamPart);
        this.toeicExamSetRepository = AppDataSource.getRepository(ToeicExamSet);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private validatePartNumber(partNumber: number) {
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 7) {
            throw new AppError("partNumber must be from 1 to 7", 400);
        }
    }

    private async ensureExamSetExists(examSetId: number) {
        this.ensurePositiveInteger(examSetId, "examSetId");

        const examSet = await this.toeicExamSetRepository.findOne({
            where: { id: examSetId },
        });

        if (!examSet) throw new AppError("Toeic exam set not found", 404);
    }

    async getAllByExamSet(examSetId: number) {
        await this.ensureExamSetExists(examSetId);

        return this.toeicExamPartRepository.find({
            where: { examSetId },
            order: { partNumber: "ASC" },
        });
    }

    async getById(id: number) {
        this.ensurePositiveInteger(id, "id");

        const part = await this.toeicExamPartRepository.findOne({
            where: { id },
        });

        if (!part) throw new AppError("Toeic exam part not found", 404);

        return part;
    }

    async create(examSetId: number, data: Partial<ToeicExamPart>) {
        await this.ensureExamSetExists(examSetId);

        if (data.partNumber === undefined) {
            throw new AppError("partNumber is required", 400);
        }
        this.validatePartNumber(data.partNumber);

        if (data.questionCount === undefined) {
            throw new AppError("questionCount is required", 400);
        }
        this.ensurePositiveInteger(data.questionCount, "questionCount");

        const existingPart = await this.toeicExamPartRepository.findOne({
            where: {
                examSetId,
                partNumber: data.partNumber,
            },
            withDeleted: true,
        });

        if (existingPart) {
            throw new AppError("Part number already exists in this exam set", 400);
        }

        const part = this.toeicExamPartRepository.create({
            examSetId,
            partNumber: data.partNumber,
            questionCount: data.questionCount,
            durationSeconds: data.durationSeconds ?? null,
        });

        return this.toeicExamPartRepository.save(part);
    }

    async update(id: number, data: Partial<ToeicExamPart>) {
        this.ensurePositiveInteger(id, "id");

        const part = await this.toeicExamPartRepository.findOne({
            where: { id },
        });

        if (!part) throw new AppError("Toeic exam part not found", 404);

        if (data.questionCount !== undefined) {
            this.ensurePositiveInteger(data.questionCount, "questionCount");
            part.questionCount = data.questionCount;
        }

        if (data.durationSeconds !== undefined) {
            part.durationSeconds = data.durationSeconds;
        }

        return this.toeicExamPartRepository.save(part);
    }

    async softDelete(id: number) {
        this.ensurePositiveInteger(id, "id");

        const part = await this.toeicExamPartRepository.findOne({
            where: { id },
        });

        if (!part) throw new AppError("Toeic exam part not found", 404);

        await this.toeicExamPartRepository.softDelete(id);
    }
}
