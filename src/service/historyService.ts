import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { UserExamAttempt } from "../entity/UserExamAttempt";

export class HistoryService {
    private examAttemptRepository = AppDataSource.getRepository(UserExamAttempt);

async getUserExamHistory(userId: string) {
    return await this.examAttemptRepository.find({
        where: { user: { id: userId } },
        relations: ["exam"], // Chỉ cần lấy tên bài thi
        order: { createdAt: "DESC" }
    });
}

}