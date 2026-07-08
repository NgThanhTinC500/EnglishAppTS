import { Router } from "express";

import { AuthController } from "../controller/authController";
import { ToeicExamSessionController } from "../controller/toeicExamSessionController";

const toeicExamSessionRouter = Router();
const authController = new AuthController();
const toeicExamSessionController = new ToeicExamSessionController();

toeicExamSessionRouter.post(
    "/toeic/exam-sets/:examSetId/start",
    authController.protect,
    toeicExamSessionController.start
);
toeicExamSessionRouter.get(
    "/toeic/sessions/history",
    authController.protect,
    toeicExamSessionController.getHistory
);
toeicExamSessionRouter.get(
    "/toeic/sessions/:sessionId",
    authController.protect,
    toeicExamSessionController.getSession
);
toeicExamSessionRouter.post(
    "/toeic/sessions/:sessionId/answers",
    authController.protect,
    toeicExamSessionController.answerQuestion
);
toeicExamSessionRouter.post(
    "/toeic/sessions/:sessionId/submit",
    authController.protect,
    toeicExamSessionController.submit
);
toeicExamSessionRouter.get(
    "/toeic/sessions/:sessionId/result",
    authController.protect,
    toeicExamSessionController.getResult
);

export default toeicExamSessionRouter;
