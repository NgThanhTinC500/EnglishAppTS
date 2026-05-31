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
} from "../schemas/toeicQuestionGroup.schema";

const toeicQuestionGroupRouter = Router();
const authController = new AuthController();
const toeicQuestionGroupController = new ToeicQuestionGroupController();

toeicQuestionGroupRouter.use(authController.protect);

toeicQuestionGroupRouter.get(
    "/toeic/parts/:examPartId/groups",
    validateRequest(getToeicQuestionGroupsByPartSchema),
    toeicQuestionGroupController.getAllByPart
);
toeicQuestionGroupRouter.post(
    "/toeic/parts/:examPartId/groups",
    authController.restrictTo("admin"),
    validateRequest(createToeicQuestionGroupSchema),
    toeicQuestionGroupController.create
);
toeicQuestionGroupRouter.get(
    "/toeic/groups/:id",
    validateRequest(getToeicQuestionGroupByIdSchema),
    toeicQuestionGroupController.getById
);
toeicQuestionGroupRouter.patch(
    "/toeic/groups/:id",
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionGroupSchema),
    toeicQuestionGroupController.update
);
toeicQuestionGroupRouter.patch(
    "/toeic/groups/:id/media",
    authController.restrictTo("admin"),
    uploadToeicGroupMedia,
    handleUploadToeicMediaError,
    toeicQuestionGroupController.updateMedia
);
toeicQuestionGroupRouter.delete(
    "/toeic/groups/:id",
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionGroupSchema),
    toeicQuestionGroupController.softDelete
);

export default toeicQuestionGroupRouter;
