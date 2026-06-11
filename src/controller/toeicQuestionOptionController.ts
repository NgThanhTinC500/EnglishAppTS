import { Request, Response } from "express";
import { ToeicQuestionOptionService } from "../service/toeicQuestionOptionService";
import catchAsync from "../utils/catchAsync";

export class ToeicQuestionOptionController {
    private toeicQuestionOptionService: ToeicQuestionOptionService;

    constructor() {
        this.toeicQuestionOptionService = new ToeicQuestionOptionService();
    }

    getAllByQuestion = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const questionId = Number(req.params.questionId);
        const options = await this.toeicQuestionOptionService.getAllByQuestion(questionId);

        res.status(200).json({
            status: "success",
            data: { options },
        });
    });

    getById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const option = await this.toeicQuestionOptionService.getById(id);

        res.status(200).json({
            status: "success",
            data: { option },
        });
    });

    create = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const questionId = Number(req.params.questionId);
        const option = await this.toeicQuestionOptionService.create(questionId, req.body);

        res.status(201).json({
            status: "success",
            data: { option },
        });
    });

    update = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const option = await this.toeicQuestionOptionService.update(id, req.body);

        res.status(200).json({
            status: "success",
            data: { option },
        });
    });

    softDelete = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        await this.toeicQuestionOptionService.softDelete(id);

        res.status(200).json({
            status: "success",
            data: { option: null },
        });
    });
}
