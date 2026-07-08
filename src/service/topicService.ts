import { Repository } from "typeorm";

import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { Topic, TopicType } from "../entity/Topic";
import { AppError } from "../utils/appError";

export class TopicService {
    private topicRepository: Repository<Topic>;
    private examRepository: Repository<Exam>;

    constructor() {
        this.topicRepository = AppDataSource.getRepository(Topic);
        this.examRepository = AppDataSource.getRepository(Exam);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private validateTopicType(type?: TopicType) {
        if (type !== undefined && !Object.values(TopicType).includes(type)) {
            throw new AppError("Kiểu topic không hợp lệ", 400);
        }
    }

    private async getExamCountByTopic(topicId: number) {
        return this.examRepository.count({
            where: { topicId },
        });
    }

    async createTopic(topicData: Partial<Topic>) {
        if (!topicData.title?.trim()) {
            throw new AppError("Bắt buộc có tiêu đề", 400);
        }

        const { title, description, type } = topicData;
        this.validateTopicType(type);

        const topic = this.topicRepository.create({
            title: title.trim(),
            description,
            type: type ?? TopicType.GRAMMAR,
        });

        return this.topicRepository.save(topic);
    }

    async updateTopic(topicId: number, topicData: Partial<Topic>) {
        this.ensurePositiveInteger(topicId, "topicId");

        const topic = await this.topicRepository.findOne({
            where: { id: topicId },
        });
        if (!topic) throw new AppError("Không tìm thấy topic", 404);

        const { title, description, type } = topicData;
        this.validateTopicType(type);

        if (type !== undefined && type !== topic.type) {
            const examCount = await this.getExamCountByTopic(topicId);

            if (examCount > 0) {
                throw new AppError("Không thể thay đổi kiểu topic sau khi đã tạo đề thi", 400);
            }
        }

        if (title !== undefined) {
            if (!title.trim()) throw new AppError("Bắt buộc có tiêu đề", 400);
            topic.title = title.trim();
        }
        if (description !== undefined) topic.description = description;
        if (type !== undefined) topic.type = type;

        return this.topicRepository.save(topic);
    }

    async deleteTopic(topicId: number) {
        this.ensurePositiveInteger(topicId, "topicId");

        const topic = await this.topicRepository.findOne({
            where: { id: topicId },
        });
        if (!topic) throw new AppError("Không tìm thấy topic", 404);

        await this.topicRepository.delete(topicId);
    }

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
                COUNT(DISTINCT q.id)::int AS "totalQuestions"
            FROM topics t
            LEFT JOIN exams e
                ON e."topicId" = t.id
                AND e."isActive" = true
            LEFT JOIN exam_questions eq
                ON eq."examId" = e.id
            LEFT JOIN questions q
                ON q.id = eq."questionId"
                AND q.category::text = t.type::text
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
