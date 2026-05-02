import { Repository } from "typeorm";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";
import { AppError } from "../utils/appError";
import { TopicType } from "../entity/Topic"; // đường dẫn tới entity Topic
export class TopicService {
    private topicRepository: Repository<Topic>
    constructor() {
        this.topicRepository = AppDataSource.getRepository(Topic)
    }

    async createTopic(topicData: Partial<Topic>) {
        const { title, description, type } = topicData;
        const topic = this.topicRepository.create({
            title,
            description,
            type
        });
        return this.topicRepository.save(topic);
    }

    async updateTopic(topicId: number, topicData: Partial<Topic>) {
        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });

        if (!topic) {
            throw new AppError("khong co topic", 404);
        }
        const { title, description } = topicData;
        if (title !== undefined) topic.title = title;
        if (description !== undefined) topic.description = description;

        return await this.topicRepository.save(topic);
    }

    async deleteTopic(topicId: number) {
        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });

        if (!topic) {
            throw new AppError("khong co topic", 404);
        }

        await this.topicRepository.remove(topic);
    }


    async getAllTopic(type?: TopicType) {
        const topics = await this.topicRepository.query(`
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

        return topics;
    }
}
