import { Request, Response } from "express";
import { ToeicQuestionService } from "../service/toeicQuestionService";
import catchAsync from "../utils/catchAsync";

export class ToeicQuestionController {
    private toeicQuestionService: ToeicQuestionService;

    constructor() {
        this.toeicQuestionService = new ToeicQuestionService();
    }

    getAllByGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const questionGroupId = Number(req.params.questionGroupId);
        const questions = await this.toeicQuestionService.getAllByGroup(questionGroupId);

        res.status(200).json({
            status: "success",
            data: { questions },
        });
    });

    getById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const question = await this.toeicQuestionService.getById(id);

        res.status(200).json({
            status: "success",
            data: { question },
        });
    });

    create = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const questionGroupId = Number(req.params.questionGroupId);
        const question = await this.toeicQuestionService.create(questionGroupId, req.body);

        res.status(201).json({
            status: "success",
            data: { question },
        });
    });

    update = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const question = await this.toeicQuestionService.update(id, req.body);

        res.status(200).json({
            status: "success",
            data: { question },
        });
    });

    setCorrectOption = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const question = await this.toeicQuestionService.setCorrectOption(id, req.body.correctOptionId);

        res.status(200).json({
            status: "success",
            data: { question },
        });
    });

    softDelete = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        await this.toeicQuestionService.softDelete(id);

        res.status(200).json({
            status: "success",
            data: { question: null },
        });
    });
}
