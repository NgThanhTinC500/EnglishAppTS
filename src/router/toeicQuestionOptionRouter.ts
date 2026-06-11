import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicQuestionOptionController } from "../controller/toeicQuestionOptionController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicQuestionOptionSchema,
    deleteToeicQuestionOptionSchema,
    getToeicQuestionOptionByIdSchema,
    getToeicQuestionOptionsByQuestionSchema,
    updateToeicQuestionOptionSchema,
} from "../validations/toeicQuestionOption.schema";

const toeicQuestionOptionRouter = Router();
const authController = new AuthController();
const toeicQuestionOptionController = new ToeicQuestionOptionController();



toeicQuestionOptionRouter.get(
    "/toeic/questions/:questionId/options",
    validateRequest(getToeicQuestionOptionsByQuestionSchema),
    toeicQuestionOptionController.getAllByQuestion
);
toeicQuestionOptionRouter.post(
    "/toeic/questions/:questionId/options",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(createToeicQuestionOptionSchema),
    toeicQuestionOptionController.create
);
toeicQuestionOptionRouter.get(
    "/toeic/options/:id",
    authController.protect,
    validateRequest(getToeicQuestionOptionByIdSchema),
    toeicQuestionOptionController.getById
);
toeicQuestionOptionRouter.patch(
    "/toeic/options/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionOptionSchema),
    toeicQuestionOptionController.update
);
toeicQuestionOptionRouter.delete(
    "/toeic/options/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionOptionSchema),
    toeicQuestionOptionController.softDelete
);

export default toeicQuestionOptionRouter;
