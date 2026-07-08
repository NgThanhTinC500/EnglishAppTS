import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { VocabularyService } from "../service/vocabularyService";
import { VocabularyLookupService } from "../service/vocabularyLookupService";
import { VocabularyPracticeService } from "../service/vocabularyPracticeService";

export class VocabularyController {
    private vocabularyService = new VocabularyService();

    private vocabularyLookupService = new VocabularyLookupService();

    private vocabularyPracticeService = new VocabularyPracticeService();

    private getRouteParam(
        value: string | string[] | undefined,
        fieldName: string
    ) {
        if (typeof value !== "string") {
            throw new AppError(` ${fieldName} không hợp lệ`, 400);
        }
        return value;
    }

    private parseId(
        value: string | string[] | undefined,
        fieldName = "id"
    ) {
        const normalizedValue = this.getRouteParam(value, fieldName);
        const id = Number(normalizedValue);
        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError(` ${fieldName} không hợp lệ`, 400);
        }

        return id;
    }

    private getUserId(req: Request) {
        if (!req.user) {
            throw new AppError("Không có quyền truy cập", 401);
        }
        return req.user.id;
    }

    createVocabularySet = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const result = await this.vocabularyService.createVocabularySet(
                userId,
                req.body
            );

            res.status(201).json({
                success: true,
                data: result,
                message: "Tạo bộ từ vựng thành công",
            });
        }
    );

    getAllVocabularySets = catchAsync(
        async (req: Request, res: Response) => {
            const result = await this.vocabularyService.getAllVocabularySets();
            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Lấy bộ từ vựng thành công",
            });
        }
    );

    getVocabularySetDetail = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.getVocabularySetById(
                setId
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Lấy chi tiết bộ từ vựng thành công",
            });
        }
    );

    updateVocabularySet = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.updateVocabularySet(
                setId,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Cập nhật bộ từ vựng thành công",
            });
        }
    );

    deleteVocabularySet = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            await this.vocabularyService.deleteVocabularySet(setId);

            res.status(200).json({
                success: true,
                data: null,
                message: "Xóa bộ từ vựng thành công",
            });
        }
    );

    lookupVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const word = String(req.query.word ?? "");
            const result = await this.vocabularyLookupService.lookupVocabulary(word);
            res.status(200).json({
                success: true,
                data: result,
                message: "Tìm kiếm từ vựng thành công",
            });
        }
    );

    getVocabularyPracticeItems = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyPracticeService.getVocabularyPracticeItems(
                setId
            );

            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Lấy mục luyện tập từ vựng thành công",
            });
        }
    );

    startPracticeSession = catchAsync(
        async (req: Request, res: Response) => {
            const userId = this.getUserId(req);
            const vocabSetId = this.parseId(
                String(req.body?.vocabSetId),
                "vocabSetId"
            );
            const mode = String(req.body?.mode ?? "");

            const result = await this.vocabularyPracticeService.startPracticeSession(
                userId,
                vocabSetId,
                mode
            );

            res.status(201).json({
                success: true,
                data: result,
                message: "Bắt đầu phiên luyện tập từ vựng thành công",
            });
        }
    );

    submitSpellingAnswer = catchAsync(
        async (req: Request, res: Response) => {
            const userId = this.getUserId(req);
            const sessionId = this.parseId(req.params.sessionId, "sessionId");
            const vocabularyId = this.parseId(
                String(req.body?.vocabularyId),
                "vocabularyId"
            );
            const answerText = String(req.body?.answerText ?? "");

            const result = await this.vocabularyPracticeService.submitSpellingAnswer(
                userId,
                sessionId,
                vocabularyId,
                answerText
            );

            res.status(201).json({
                success: true,
                data: result,
                message: "Gửi đáp án chính tả thành công",
            });
        }
    );

    createVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");
            const result = await this.vocabularyService.createVocabulary(
                setId,
                req.body
            );

            res.status(201).json({
                success: true,
                data: result,
                message: "Tạo từ vựng thành công",
            });
        }
    );

    getVocabulariesBySetId = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.getVocabulariesBySetId(
                setId
            );

            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Lấy từ vựng thành công",
            });
        }
    );

    getVocabularyDetail = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");

            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            const result = await this.vocabularyService.getVocabularyDetail(
                setId,
                vocabularyId
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Lấy chi tiết từ vựng thành công",
            });
        }
    );

    updateVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");
            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            const result = await this.vocabularyService.updateVocabulary(
                setId,
                vocabularyId,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Cập nhật từ vựng thành công",
            });
        }
    );

    deleteVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const setId = this.parseId(req.params.setId, "setId");
            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            await this.vocabularyService.deleteVocabulary(
                setId,
                vocabularyId
            );

            res.status(200).json({
                success: true,
                data: null,
                message: "Xóa từ vựng thành công",
            });
        }
    );
}
