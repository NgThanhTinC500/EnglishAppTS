import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicQuestionController } from "../controller/toeicQuestionController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicQuestionSchema,
    deleteToeicQuestionSchema,
    getToeicQuestionByIdSchema,
    getToeicQuestionsByGroupSchema,
    setToeicQuestionCorrectOptionSchema,
    updateToeicQuestionSchema,
} from "../validations/toeicQuestion.schema";

const toeicQuestionRouter = Router();
const authController = new AuthController();
const toeicQuestionController = new ToeicQuestionController();



toeicQuestionRouter.get(
    "/toeic/groups/:questionGroupId/questions",
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
    "/toeic/questions/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionSchema),
    toeicQuestionController.update
);
toeicQuestionRouter.patch(
    "/toeic/questions/:id/correct-option",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(setToeicQuestionCorrectOptionSchema),
    toeicQuestionController.setCorrectOption
);
toeicQuestionRouter.delete(
    "/toeic/questions/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionSchema),
    toeicQuestionController.softDelete
);

export default toeicQuestionRouter;
