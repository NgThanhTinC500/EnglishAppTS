import { Request, Response } from "express";
import { ProgressService } from "../service/progressService";
import { AppError } from "../utils/appError";
import catchAsync from "../utils/catchAsync";

export class ProgressController {
    private progressService = new ProgressService();

    private getUserId(req: Request) {
        if (!req.user) {
            throw new AppError("Unauthorized", 401);
        }

        return req.user.id;
    }

    getGrammarProgress = catchAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const days = req.query.days ? Number(req.query.days) : undefined;
        const progress = await this.progressService.getGrammarProgress(userId, days);

        res.status(200).json({
            success: true,
            data: progress,
            message: "Get grammar progress successfully",
        });
    });

    getVocabularyProgress = catchAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const days = req.query.days ? Number(req.query.days) : undefined;
        const progress = await this.progressService.getVocabularyProgress(userId, days);

        res.status(200).json({
            success: true,
            data: progress,
            message: "Get vocabulary progress successfully",
        });
    });
}
