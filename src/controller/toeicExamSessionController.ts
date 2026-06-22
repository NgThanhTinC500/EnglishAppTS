import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { ToeicExamSessionService } from "../service/toeicExamSessionService";

export class ToeicExamSessionController {
    private toeicExamSessionService = new ToeicExamSessionService();

    start = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examSetId = Number(req.params.examSetId);
        const result = await this.toeicExamSessionService.start(
            req.user.id,
            examSetId
        );

        res.status(201).json({
            status: "success",
            data: result,
        });
    });


    getHistory = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const history = await this.toeicExamSessionService.getHistory(req.user.id);

        res.status(200).json({
            status: "success",
            data: { history },
        });
    });
    getSession = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const sessionId = Number(req.params.sessionId);
        const result = await this.toeicExamSessionService.getSession(
            sessionId,
            req.user.id
        );

        res.status(200).json({
            status: "success",
            data: result,
        });
    });

    answerQuestion = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const sessionId = Number(req.params.sessionId);
        const result = await this.toeicExamSessionService.answerQuestion(
            sessionId,
            req.user.id,
            Number(req.body?.questionId),
            Number(req.body?.selectedOptionId),
            Number(req.body?.timeSpentSeconds ?? 0)
        );

        res.status(200).json({
            status: "success",
            data: { answer: result },
        });
    });

    submit = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const sessionId = Number(req.params.sessionId);
        const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
        const result = await this.toeicExamSessionService.submit(
            sessionId,
            req.user.id,
            answers
        );

        res.status(200).json({
            status: "success",
            data: result,
        });
    });

    getResult = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const sessionId = Number(req.params.sessionId);
        const result = await this.toeicExamSessionService.getResult(
            sessionId,
            req.user.id
        );

        res.status(200).json({
            status: "success",
            data: result,
        });
    });
}
