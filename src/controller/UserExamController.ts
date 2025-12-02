import { Request, Response } from "express";
import { UserExamService } from "../service/userExamService"

const userExamService = new UserExamService();

export class UserExamController {
    // POST /api/user/exams/:examId/start   
    static async startExam(req: Request, res: Response): Promise<void> {
        const examId = parseInt(req.params.examId)
        console.log("1")
        const userId = req.user.id
        console.log("2")
        const attempt = await userExamService.startExam(userId, examId)
        res.status(201).json({
            success: true,
            data: attempt,
            message: "Exam started successfully"
        });
    }
    // POST /api/user/attempts/:attemptId/answers
    static async submitAnswer(req: Request, res: Response): Promise<void> {
        const attemptId = req.params.attemptId;
        const { questionId, answerId } = req.body;
        const userAnswer = await userExamService.submitAnswer(
            attemptId, questionId, answerId
        );
        res.json({
            success: true,
            data: userAnswer,
            message: "Answer submitted successfully"
        })
    }
    // POST /api/user/attempts/:attemptId/submit
    static async submitExam(req: Request, res: Response) {
        const attemptId = req.params.attemptId;

        const result = await userExamService.submitExam(attemptId);
        res.json({
            success: true,
            data: result,
            message: "Exam submitted successfully"
        });
    }
      // GET /api/user/attempts/:attemptId/result - Lấy kết quả bài thi
    static async getExamResult(req: Request, res: Response) {
        const attemptId = parseInt(req.params.attemptId);
        const result = await userExamService.getExamResult(attemptId);
        if (!result) {
            res.status(404).json({
                success: false,
                message: "Attempt not found"
            });
            return;
        }
        res.json({
            success: true,
            data: result
        });
    }
}