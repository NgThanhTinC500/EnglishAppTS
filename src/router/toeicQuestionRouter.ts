import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicQuestionController } from "../controller/toeicQuestionController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicQuestionSchema,
    deleteToeicQuestionSchema,
    getToeicQuestionByIdSchema,
    getToeicQuestionsByGroupSchema,
    updateToeicQuestionWithOptionsSchema,
} from "../validations/toeicQuestion.schema";

const toeicQuestionRouter = Router();
const authController = new AuthController();
const toeicQuestionController = new ToeicQuestionController();



toeicQuestionRouter.get(
    "/toeic/groups/:questionGroupId/questions",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(getToeicQuestionsByGroupSchema),
    toeicQuestionController.getAllByGroup
);
toeicQuestionRouter.post(
    "/toeic/groups/:questionGroupId/questions",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(createToeicQuestionSchema),
    toeicQuestionController.create
);
toeicQuestionRouter.get(
    "/toeic/questions/:id",
    authController.protect,
    validateRequest(getToeicQuestionByIdSchema),
    toeicQuestionController.getById
);
toeicQuestionRouter.patch(
    "/toeic/questions/:id/with-options",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionWithOptionsSchema),
    toeicQuestionController.updateWithOptions
);
toeicQuestionRouter.delete(
    "/toeic/questions/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionSchema),
    toeicQuestionController.softDelete
);

export default toeicQuestionRouter;
