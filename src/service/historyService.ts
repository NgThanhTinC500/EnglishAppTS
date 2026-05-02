import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Attempt } from "../entity/Attempt";

export class HistoryService {
    private attemptRepository: Repository<Attempt>;

    constructor() {
        this.attemptRepository = AppDataSource.getRepository(Attempt);
    }

    async getUserExamHistory(userId: string) {
        return await this.attemptRepository.find({
            where: { userId },
            relations: {
                exam: true
            },
            order: { createdAt: "DESC" }
        });
    }
}
