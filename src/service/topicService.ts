import { Repository } from "typeorm";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";
import { AppError } from "../utils/appError";

export class TopicService {
    private topicRepository: Repository<Topic>
    constructor() {
        this.topicRepository = AppDataSource.getRepository(Topic)
    }
    async createTopic(topicData: Partial<Topic>) {
        const { title, description } = topicData;
        const topic = this.topicRepository.create({
            title,
            description
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
    async gellAllTopic() {
        const topics = this.topicRepository.find();
        return topics;
    }
}