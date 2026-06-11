import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicQuestionGroupController } from "../controller/toeicQuestionGroupController";
import {
    handleUploadToeicMediaError,
    uploadToeicGroupMedia,
} from "../middlewares/uploadToeicMedia";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicQuestionGroupSchema,
    deleteToeicQuestionGroupSchema,
    getToeicQuestionGroupByIdSchema,
    getToeicQuestionGroupsByPartSchema,
    updateToeicQuestionGroupSchema,
} from "../validations/toeicQuestionGroup.schema";

const toeicQuestionGroupRouter = Router();
const authController = new AuthController();
const toeicQuestionGroupController = new ToeicQuestionGroupController();



toeicQuestionGroupRouter.get(
    "/toeic/parts/:examPartId/groups",
    validateRequest(getToeicQuestionGroupsByPartSchema),
    authController.protect,
    toeicQuestionGroupController.getAllByPart
);
toeicQuestionGroupRouter.post(
    "/toeic/parts/:examPartId/groups",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(createToeicQuestionGroupSchema),
    toeicQuestionGroupController.create
);
toeicQuestionGroupRouter.get(
    "/toeic/groups/:id",
    validateRequest(getToeicQuestionGroupByIdSchema),
    authController.protect,
    authController.restrictTo("admin"),
    toeicQuestionGroupController.getById
);
toeicQuestionGroupRouter.patch(
    "/toeic/groups/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionGroupSchema),
    toeicQuestionGroupController.update
);
toeicQuestionGroupRouter.patch(
    "/toeic/groups/:id/media",
    authController.protect,
    authController.restrictTo("admin"),
    uploadToeicGroupMedia,
    handleUploadToeicMediaError,
    toeicQuestionGroupController.updateMedia
);
toeicQuestionGroupRouter.delete(
    "/toeic/groups/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionGroupSchema),
    toeicQuestionGroupController.softDelete
);

export default toeicQuestionGroupRouter;
