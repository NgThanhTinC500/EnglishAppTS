import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Topic, TopicType } from "../entity/Topic";
import { AppError } from "../utils/appError";

export class TopicService {
    private topicRepository: Repository<Topic>;

    constructor() {
        this.topicRepository = AppDataSource.getRepository(Topic);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private validateTopicType(type?: TopicType) {
        if (type !== undefined && !Object.values(TopicType).includes(type)) {
            throw new AppError("Invalid topic type", 400);
        }
    }

    async createTopic(topicData: Partial<Topic>) {
        if (!topicData.title?.trim()) {
            throw new AppError("Title is required", 400);
        }

        const { title, description, type } = topicData;
        this.validateTopicType(type);

        const topic = this.topicRepository.create({
            title: title.trim(),
            description,
            type: type ?? TopicType.GRAMMAR
        });

        return this.topicRepository.save(topic);
    }

    async updateTopic(topicId: number, topicData: Partial<Topic>) {
        this.ensurePositiveInteger(topicId, "topicId");

        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });
        if (!topic) throw new AppError("Topic not found", 404);

        const { title, description, type } = topicData;
        this.validateTopicType(type);

        if (title !== undefined) {
            if (!title.trim()) throw new AppError("Title is required", 400);
            topic.title = title.trim();
        }
        if (description !== undefined) topic.description = description;
        if (type !== undefined) topic.type = type;

        return this.topicRepository.save(topic);
    }

    async deleteTopic(topicId: number) {
        this.ensurePositiveInteger(topicId, "topicId");

        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });
        if (!topic) throw new AppError("Topic not found", 404);

        await this.topicRepository.delete(topicId);
    }

    // Get all topics with total questions count, filter by type if provided.
    async getAllTopic(type?: TopicType) {
        this.validateTopicType(type);

        return this.topicRepository.query(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.type,
                t."createdAt",
                t."updatedAt",
                COUNT(eq.id)::int AS "totalQuestions"
            FROM topics t
            LEFT JOIN exams e
                ON e."topicId" = t.id
                AND e."isActive" = true
            LEFT JOIN exam_questions eq
                ON eq."examId" = e.id
            WHERE ($1::text IS NULL OR t.type = $1::topics_type_enum)
            GROUP BY
                t.id,
                t.title,
                t.description,
                t.type,
                t."createdAt",
                t."updatedAt"
            ORDER BY t."createdAt" DESC
        `, [type ?? null]);
    }
}
