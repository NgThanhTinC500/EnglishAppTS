import { Repository } from "typeorm";
import { Attempt, AttemptMode, AttemptStatus } from "../entity/Attempt";
import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { QuestionOption } from "../entity/QuestionOption";
import { AnswerResult, AttemptAnswer } from "../entity/AttemptAnswer";
import { AppError } from "../utils/appError";

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
        if (!exam) throw new AppError("Exam not found", 404);
        const existingAttempt = this.attemptRepository.findOne({
            where: {
                userId, examId, status: AttemptStatus.IN_PROGRESS
            }
        })
        if (existingAttempt) {
            return existingAttempt;
        }
        const attempt = this.attemptRepository.create({
            userId,
            mode: AttemptMode.PRACTICE,
            examId,
            status: AttemptStatus.IN_PROGRESS,
            startedAt: new Date()
        })
        return this.attemptRepository.save(attempt);
    }
    async answerQuestion(attemptId: number, questionId: number, selectedOptionId: number) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId }
        });

        if (!attempt) {
            throw new AppError("Không tìm thấy lần thi", 404);
        }
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Bài thi không còn ở trạng thái làm bài", 400);
        }
        const option = await this.questOptionRepository.findOne({
            where: { id: selectedOptionId, questionId }
        })
        if (!option) {
            throw new AppError("ko co cau hoi va dap an nay", 404)
        }
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
    async submitExam(attemptId: number, userId: string, examId: number) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId: userId, examId: examId }
        })
        if (!attempt) {
            throw new AppError("Ko co lần thi này", 404)
        }
        if (attempt.status === AttemptStatus.SUBMITTED) {
            throw new AppError("bai thi da nop roi", 400)
        }
        const answers = await this.attemptAnswerRepository.find({
            where: { attemptId: attemptId }
        })
        const correctCount = answers.filter(
            (item) => item.result === AnswerResult.CORRECT
        ).length;

        const totalQuestions = answers.length;
        const score = totalQuestions > 0
            ? Number(((correctCount / totalQuestions) * 10).toFixed(2))
            : 0;

        attempt.status = AttemptStatus.SUBMITTED
        attempt.score = score;
        attempt.totalQuestions = totalQuestions;
        attempt.correctCount = correctCount;
        attempt.submittedAt = new Date();

        return await this.attemptRepository.save(attempt)

    }

}