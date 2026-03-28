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
        const exam = await this.examRepository.findOne({
            where: { id: examId, isActive: true },
            relations: {
                examQuestions: {
                    question: {
                        options: true
                    }
                }
            }
        });
        // dữ liệu sẽ trả về 1 object,  nhiều dữ liệu sẽ gom thành mảng, trong mảng sẽ gồm object
        if (!exam) throw new AppError("Exam not found", 404);
        const existingAttempt = await this.attemptRepository.findOne({
            where: {
                userId, examId, status: AttemptStatus.IN_PROGRESS
            }
        })

        // trả về lần làm dỡ
        if (existingAttempt) {
            // trả về đáp án lần đó luôn
            const answers = await this.attemptAnswerRepository.find({
                where: {
                    attemptId: existingAttempt.id
                }
            })
            console.log(answers)
            return {
                attempt: existingAttempt,
                // với mỗi phần tử trong examquestion ta lấy question
                questions: exam.examQuestions.map(eq => eq.question),
                answers // answers đã chọn trước đó };
            }
        }
        const attempt = await this.attemptRepository.save(
            this.attemptRepository.create({
                userId,
                examId,
                mode: AttemptMode.PRACTICE,
                status: AttemptStatus.IN_PROGRESS,
                startedAt: new Date()
            })
        );
        return {
            attempt,
            questions: exam.examQuestions.map(eq => eq.question),
            answers: []
        }
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
        const correctOption = await this.questOptionRepository.findOne({
            where: { questionId, isCorrect: true }
        })
        console.log(correctOption.id)
        const existing = await this.attemptAnswerRepository.findOne({
            where: { attemptId, questionId }
        });

        const result = option.isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG;


        if (existing) {
            existing.selectedOptionId = Number(selectedOptionId);
            existing.result = result;
            existing.answeredAt = new Date();
            existing.correctOptionId = correctOption?.id;
            return await this.attemptAnswerRepository.save(existing);
        }
        console.log("check service")


        const answer = this.attemptAnswerRepository.create({
            attemptId,
            questionId,
            selectedOptionId,
            result,
            answeredAt: new Date(),
            correctOptionId: correctOption?.id,
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

        // Lấy tổng số câu hỏi thật sự của đề
        const exam = await this.examRepository.findOne({
            where: { id: examId },
            relations: { examQuestions: true }
        })
        if (!exam) throw new AppError("Không tìm thấy đề thi", 404)

        const totalQuestions = exam.examQuestions.length; // tổng câu của đề

        const answers = await this.attemptAnswerRepository.find({
            where: { attemptId: attemptId }
        })

        const correctCount = answers.filter(
            (item) => item.result === AnswerResult.CORRECT
        ).length;

        const score = totalQuestions > 0
            ? Number(((correctCount / totalQuestions) * 10).toFixed(2))
            : 0;

        attempt.status = AttemptStatus.SUBMITTED
        attempt.score = score;
        attempt.totalQuestions = totalQuestions;   // tổng câu đề
        attempt.correctCount = correctCount;        // số câu đúng
        attempt.submittedAt = new Date();

        return await this.attemptRepository.save(attempt)
    }

}