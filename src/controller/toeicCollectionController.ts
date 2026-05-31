import { Request, Response } from "express";
import { ToeicCollectionService } from "../service/toeicCollectionService";
import catchAsync from "../utils/catchAsync";

export class ToeicCollectionController {
    private toeicCollectionService: ToeicCollectionService;

    constructor() {
        this.toeicCollectionService = new ToeicCollectionService();
    }

    getAllToeicCollections = catchAsync(async (_req: Request, res: Response): Promise<void> => {
        const collections = await this.toeicCollectionService.getAllToeicCollections();

        res.status(200).json({
            status: "success",
            data: { collections },
        });
    });

    getToeicCollectionById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.id);
        const collection = await this.toeicCollectionService.getToeicCollectionById(collectionId);

        res.status(200).json({
            status: "success",
            data: { collection },
        });
    });

    createToeicCollection = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collection = await this.toeicCollectionService.createToeicCollection(req.body);

        res.status(201).json({
            status: "success",
            data: { collection },
        });
    });

    updateToeicCollection = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.id);
        const collection = await this.toeicCollectionService.updateToeicCollection(collectionId, req.body);

        res.status(200).json({
            status: "success",
            data: { collection },
        });
    });

    deleteToeicCollection = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const collectionId = Number(req.params.id);
        await this.toeicCollectionService.deleteToeicCollection(collectionId);

        res.status(200).json({
            status: "success",
            data: { collection: null },
        });
    });
}
