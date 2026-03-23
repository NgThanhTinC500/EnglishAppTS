import { Repository } from "typeorm";
import { Attempt, AttemptMode, AttemptStatus } from "../entity/Attempt";
import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { QuestionOption } from "../entity/QuestionOption";
import { AnswerResult, AttemptAnswer } from "../entity/AttemptAnswer";

export class AttemptService {
    private attemptRepository: Repository<Attempt>
    private attemptAnswerRepository: Repository<AttemptAnswer>
    private examRepository: Repository<Exam>
    private questOptionRepository: Repository<QuestionOption>
    constructor() {
        this.attemptRepository = AppDataSource.getRepository(Attempt)
        this.examRepository = AppDataSource.getRepository(Exam)
        this.questOptionRepository = AppDataSource.getRepository(QuestionOption)
        this.attemptAnswerRepository = AppDataSource.getRepository(AttemptAnswer)
    }

    async startExam(userId: string, examId: number) {
        const exam = await this.examRepository.findOne({ where: { id: examId, isActive: true } });
        if (!exam) throw new Error('Exam not found')
        const attempt = await this.attemptRepository.create({
            userId,
            mode: AttemptMode.PRACTICE,
            examId,
            status: AttemptStatus.IN_PROGRESS,
            startedAt: new Date()
        })
        return this.attemptRepository.save(attempt);
    }
    async answerQuestion(attemptId: number, questionId: number, selectedOptionId: number) {
        const option = await this.questOptionRepository.findOne({
            where: { id: selectedOptionId, questionId }
        })
        const existing = await this.attemptAnswerRepository.findOne({
            where: { attemptId, questionId }
        });

        const result = option.isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG;
        if (existing) {
            existing.selectedOptionId = Number(selectedOptionId);
            existing.result = result;
            existing.answeredAt = new Date();
            return await this.attemptAnswerRepository.save(existing);
        }
        const answer = this.attemptAnswerRepository.create({
            attemptId,
            questionId,
            selectedOptionId,
            result,
            answeredAt: new Date()
        })
        return await this.attemptAnswerRepository.save(answer);
    }
}