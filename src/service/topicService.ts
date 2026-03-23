import { Repository } from "typeorm";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";

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
    async gellAllTopic() {
        const topics = this.topicRepository.find();
        return topics;
    }
}