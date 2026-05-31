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
} from "../schemas/toeicQuestion.schema";

const toeicQuestionRouter = Router();
const authController = new AuthController();
const toeicQuestionController = new ToeicQuestionController();

toeicQuestionRouter.use(authController.protect);

toeicQuestionRouter.get(
    "/toeic/groups/:questionGroupId/questions",
    validateRequest(getToeicQuestionsByGroupSchema),
    toeicQuestionController.getAllByGroup
);
toeicQuestionRouter.post(
    "/toeic/groups/:questionGroupId/questions",
    authController.restrictTo("admin"),
    validateRequest(createToeicQuestionSchema),
    toeicQuestionController.create
);
toeicQuestionRouter.get(
    "/toeic/questions/:id",
    validateRequest(getToeicQuestionByIdSchema),
    toeicQuestionController.getById
);
toeicQuestionRouter.patch(
    "/toeic/questions/:id",
    authController.restrictTo("admin"),
    validateRequest(updateToeicQuestionSchema),
    toeicQuestionController.update
);
toeicQuestionRouter.patch(
    "/toeic/questions/:id/correct-option",
    authController.restrictTo("admin"),
    validateRequest(setToeicQuestionCorrectOptionSchema),
    toeicQuestionController.setCorrectOption
);
toeicQuestionRouter.delete(
    "/toeic/questions/:id",
    authController.restrictTo("admin"),
    validateRequest(deleteToeicQuestionSchema),
    toeicQuestionController.softDelete
);

export default toeicQuestionRouter;
