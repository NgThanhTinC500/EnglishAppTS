import { Request, Response } from "express";
import { ToeicExamSetService } from "../service/toeicExamSetService";
import catchAsync from "../utils/catchAsync";

export class ToeicExamSetController {
    private toeicExamSetService: ToeicExamSetService;

    constructor() {
        this.toeicExamSetService = new ToeicExamSetService();
    }

    getAll = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.collectionId);
        const examSets = await this.toeicExamSetService.getAll(collectionId);

        res.status(200).json({
            status: "success",
            data: { examSets },
        });
    });

    getById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.collectionId);
        const id = Number(req.params.id);
        const examSet = await this.toeicExamSetService.getById(collectionId, id);

        res.status(200).json({
            status: "success",
            data: { examSet },
        });
    });

    getFull = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const includeCorrect = req.user?.role === "admin";
        const examSet = await this.toeicExamSetService.getFull(id, {
            includeCorrect,
            requirePublished: !includeCorrect,
        });

        res.status(200).json({
            status: "success",
            data: { examSet },
        });
    });

    validate = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const validation = await this.toeicExamSetService.validate(id);

        res.status(200).json({
            status: "success",
            data: { validation },
        });
    });

    publish = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const isPublished = req.body?.isPublished !== false;
        const examSet = await this.toeicExamSetService.publish(id, isPublished);

        res.status(200).json({
            status: "success",
            data: { examSet },
        });
    });

    create = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.collectionId);
        const examSet = await this.toeicExamSetService.create({
            ...req.body,
            collectionId,
        });

        res.status(201).json({
            status: "success",
            data: { examSet },
        });
    });

    update = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.collectionId);
        const id = Number(req.params.id);
        const examSet = await this.toeicExamSetService.update(collectionId, id, req.body);

        res.status(200).json({
            status: "success",
            data: { examSet },
        });
    });

    softDelete = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.collectionId);
        const id = Number(req.params.id);
        await this.toeicExamSetService.softDelete(collectionId, id);

        res.status(200).json({
            status: "success",
            data: { examSet: null },
        });
    });
}
