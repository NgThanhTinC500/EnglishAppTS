import { Request, Response } from "express";
import { ToeicExamPartService } from "../service/toeicExamPartService";
import catchAsync from "../utils/catchAsync";

export class ToeicExamPartController {
    private toeicExamPartService: ToeicExamPartService;

    constructor() {
        this.toeicExamPartService = new ToeicExamPartService();
    }

    getAllByExamSet = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examSetId = Number(req.params.examSetId);
        const parts = await this.toeicExamPartService.getAllByExamSet(examSetId);

        res.status(200).json({
            status: "success",
            data: { parts },
        });
    });

    getById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const part = await this.toeicExamPartService.getById(id);

        res.status(200).json({
            status: "success",
            data: { part },
        });
    });

    create = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examSetId = Number(req.params.examSetId);
        const part = await this.toeicExamPartService.create(examSetId, req.body);

        res.status(201).json({
            status: "success",
            data: { part },
        });
    });

    update = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const part = await this.toeicExamPartService.update(id, req.body);

        res.status(200).json({
            status: "success",
            data: { part },
        });
    });

    softDelete = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        await this.toeicExamPartService.softDelete(id);

        res.status(200).json({
            status: "success",
            data: { part: null },
        });
    });
}
