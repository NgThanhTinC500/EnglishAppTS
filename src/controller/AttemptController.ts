import { AttemptService } from "../service/attemptService"
import { AttemptPracticeMode } from "../entity/Attempt";
import { AppError } from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { Request, Response } from "express";
export class AttemptController {
    private attemptService = new AttemptService();

    private getUserId(req: Request) {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }
        return req.user.id;
    }

    startExam = catchAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const examId = Number(req.params.examId);
        const restart = req.body?.restart === true;
        const practiceMode = req.body?.practiceMode as AttemptPracticeMode | undefined;
        const attempt = await this.attemptService.startExam(
            userId,
            examId,
            restart,
            practiceMode
        );

        res.status(201).json({
            success: true,
            data: attempt,
            message: "Start Exam"
        });
    });

    answerQuestion = catchAsync(async (req: Request, res: Response) => {
        const attemptId = Number(req.params.attemptId);
        const userId = this.getUserId(req);
        const { questionId, selectedOptionId } = req.body;
        const result = await this.attemptService.answerQuestion(
            attemptId, userId, Number(questionId), Number(selectedOptionId)
        )
        res.status(201).json({
            success: true,
            data: result,
            message: "Create Answer"
        })
    })

    answerDictation = catchAsync(async (req: Request, res: Response) => {
        const attemptId = Number(req.params.attemptId);
        const userId = this.getUserId(req);
        const { questionId, answerText, answers } = req.body;
        const result = await this.attemptService.answerDictation(
            attemptId,
            userId,
            Number(questionId),
            String(answerText ?? ""),
            Array.isArray(answers) ? answers : undefined
        )
        res.status(201).json({
            success: true,
            data: result,
            message: "Create Dictation Answer"
        })
    })

    submitExam = catchAsync(async (req: Request, res: Response) => {
        const attemptId = Number(req.params.attemptId);
        const userId = this.getUserId(req);
        const examId = Number(req.params.examId);
        const result = await this.attemptService.submitExam(
            attemptId,
            userId,
            examId,
            req.body?.questionIds
        )
        res.status(200).json({
            success: true,
            data: result,
            message: "Exam submitted successfully"
        })
    })

}
