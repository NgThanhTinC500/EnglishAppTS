import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { VocabularyService } from "../service/vocabularyService";

export class VocabularyController {
    private vocabularyService = new VocabularyService();

    private getRouteParam(
        value: string | string[] | undefined,
        fieldName: string
    ) {
        if (typeof value !== "string") {
            throw new AppError(`Invalid ${fieldName}`, 400);
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
            throw new AppError(`Invalid ${fieldName}`, 400);
        }

        return id;
    }

    /*
        ======================
        VOCABULARY SET
        ======================
    */

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
                message: "Create vocabulary set successfully",
            });
        }
    );

    getAllVocabularySets = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);

            const result = await this.vocabularyService.getAllVocabularySets(
                userId
            );

            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Get vocabulary sets successfully",
            });
        }
    );

    getVocabularySetDetail = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.getVocabularySetById(
                userId,
                setId
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Get vocabulary set successfully",
            });
        }
    );

    updateVocabularySet = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.updateVocabularySet(
                userId,
                setId,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Update vocabulary set successfully",
            });
        }
    );

    deleteVocabularySet = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            await this.vocabularyService.deleteVocabularySet(userId, setId);

            res.status(200).json({
                success: true,
                data: null,
                message: "Delete vocabulary set successfully",
            });
        }
    );

    /*
        ======================
        VOCABULARY
        ======================
    */

    getVocabularyPracticeItems = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.topicId, "topicId");

            const result = await this.vocabularyService.getVocabularyPracticeItems(
                userId,
                setId
            );

            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Get vocabulary practice items successfully",
            });
        }
    );

    checkVocabularyPracticeAnswer = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const vocabularyId = this.parseId(
                String(req.body?.vocabularyId),
                "vocabularyId"
            );
            const answerText = String(req.body?.answerText ?? "");

            const result =
                await this.vocabularyService.checkVocabularyPracticeAnswer(
                    userId,
                    vocabularyId,
                    answerText
                );

            res.status(200).json({
                success: true,
                data: result,
                message: "Check vocabulary answer successfully",
            });
        }
    );

    createVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.createVocabulary(
                userId,
                setId,
                req.body
            );

            res.status(201).json({
                success: true,
                data: result,
                message: "Create vocabulary successfully",
            });
        }
    );

    getVocabulariesBySetId = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            const result = await this.vocabularyService.getVocabulariesBySetId(
                userId,
                setId
            );

            res.status(200).json({
                success: true,
                total: result.length,
                data: result,
                message: "Get vocabularies successfully",
            });
        }
    );

    getVocabularyDetail = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");

            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            const result = await this.vocabularyService.getVocabularyDetail(
                userId,
                setId,
                vocabularyId
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Get vocabulary detail successfully",
            });
        }
    );

    updateVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");
            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            const result = await this.vocabularyService.updateVocabulary(
                userId,
                setId,
                vocabularyId,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Update vocabulary successfully",
            });
        }
    );

    deleteVocabulary = catchAsync(
        async (req: Request, res: Response) => {
            const userId = String(req.user?.id);
            const setId = this.parseId(req.params.setId, "setId");
            const vocabularyId = this.parseId(
                req.params.vocabularyId,
                "vocabularyId"
            );

            await this.vocabularyService.deleteVocabulary(
                userId,
                setId,
                vocabularyId
            );

            res.status(200).json({
                success: true,
                data: null,
                message: "Delete vocabulary successfully",
            });
        }
    );
}
