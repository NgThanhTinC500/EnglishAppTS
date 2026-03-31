import { AttemptService } from "../service/attemptService"
import catchAsync from "../utils/catchAsync";
import { Request, Response } from "express";
export class AttemptController {
    private attemptService = new AttemptService();

    startExam = catchAsync(async (req: Request, res: Response) => {
        const userId = req.user.id;
        console.log(userId)
        const examId = Number(req.params.examId);
        const attempt = await this.attemptService.startExam(userId, examId)
        res.status(201).json({
            succes: true,
            data: attempt,
            message: "Start Exam"
        })
    })
    answerQuestion = catchAsync(async (req: Request, res: Response) => {
        console.log("check")
        const attemptId = Number(req.params.attemptId);
        const { questionId, selectedOptionId } = req.body;
        const result = await this.attemptService.answerQuestion(
            attemptId, questionId, selectedOptionId
        )
        res.status(201).json({
            success: true,
            data: result,
            message: "create answer"
        })
    })
    submitExam = catchAsync(async (req: Request, res: Response) => {
        const attemptId = Number(req.params.attemptId);
        const userId = req.user.id
        const examId = Number(req.params.examId)
        const result = await this.attemptService.submitExam(attemptId, userId, examId)
        res.status(200).json({
            success: true,
            data: result,
            message: "Hoan thanh bai thi"
        })
    })

}