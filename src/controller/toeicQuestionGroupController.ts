import { Request, Response } from "express";
import { ToeicQuestionGroupService } from "../service/toeicQuestionGroupService";
import catchAsync from "../utils/catchAsync";
import { toToeicMediaUrl } from "../middlewares/uploadToeicMedia";

export class ToeicQuestionGroupController {
    private toeicQuestionGroupService: ToeicQuestionGroupService;

    constructor() {
        this.toeicQuestionGroupService = new ToeicQuestionGroupService();
    }

    private normalizeOptionalUrl(value: unknown) {
        return typeof value === "string" && value.trim() ? value.trim() : undefined;
    }

    private getBodyImageUrls(body: Record<string, unknown>) {
        const value = body.imageUrls;
        const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

        return values
            .flatMap((item) => String(item).split("\n"))
            .map((item) => item.trim())
            .filter(Boolean);
    }

    getAllByPart = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examPartId = Number(req.params.examPartId);
        const groups = await this.toeicQuestionGroupService.getAllByPart(examPartId);

        res.status(200).json({
            status: "success",
            data: { groups },
        });
    });

    getById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const group = await this.toeicQuestionGroupService.getById(id);

        res.status(200).json({
            status: "success",
            data: { group },
        });
    });

    create = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examPartId = Number(req.params.examPartId);
        const files = req.files as
            | { audio?: Express.Multer.File[]; images?: Express.Multer.File[] }
            | undefined;
        const uploadedAudioUrl = files?.audio?.[0] ? toToeicMediaUrl(files.audio[0]) : undefined;
        const audioUrl = uploadedAudioUrl || this.normalizeOptionalUrl(req.body.audioUrl);
        const imageUrls = [
            ...this.getBodyImageUrls(req.body),
            ...(files?.images?.map((file) => toToeicMediaUrl(file)) ?? []),
        ];
        const group = await this.toeicQuestionGroupService.create(examPartId, {
            ...req.body,
            audioUrl: audioUrl ?? null,
            images: imageUrls.map((imageUrl, index) => ({
                imageOrder: index + 1,
                imageUrl,
            })),
        });

        res.status(201).json({
            status: "success",
            data: { group },
        });
    });

    update = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const group = await this.toeicQuestionGroupService.update(id, req.body);

        res.status(200).json({
            status: "success",
            data: { group },
        });
    });

    updateMedia = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        const files = req.files as
            | { audio?: Express.Multer.File[]; images?: Express.Multer.File[] }
            | undefined;
        const uploadedAudioUrl = files?.audio?.[0] ? toToeicMediaUrl(files.audio[0]) : undefined;
        const audioUrl = uploadedAudioUrl || this.normalizeOptionalUrl(req.body.audioUrl);
        const imageUrls = [
            ...this.getBodyImageUrls(req.body),
            ...(files?.images?.map((file) => toToeicMediaUrl(file)) ?? []),
        ];

        const group = await this.toeicQuestionGroupService.updateMedia(id, {
            audioUrl,
            imageUrls,
        });

        res.status(200).json({
            status: "success",
            data: { group },
        });
    });

    softDelete = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const id = Number(req.params.id);
        await this.toeicQuestionGroupService.softDelete(id);

        res.status(200).json({
            status: "success",
            data: { group: null },
        });
    });
}
