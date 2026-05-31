import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicExamSessionController } from "../controller/toeicExamSessionController";

const toeicExamSessionRouter = Router();
const authController = new AuthController();
const toeicExamSessionController = new ToeicExamSessionController();

toeicExamSessionRouter.use(authController.protect);

toeicExamSessionRouter.post(
    "/toeic/exam-sets/:examSetId/start",
    toeicExamSessionController.start
);
toeicExamSessionRouter.get(
    "/toeic/sessions/history",
    toeicExamSessionController.getHistory
);
toeicExamSessionRouter.get(
    "/toeic/sessions/:sessionId",
    toeicExamSessionController.getSession
);
toeicExamSessionRouter.post(
    "/toeic/sessions/:sessionId/answers",
    toeicExamSessionController.answerQuestion
);
toeicExamSessionRouter.post(
    "/toeic/sessions/:sessionId/submit",
    toeicExamSessionController.submit
);
toeicExamSessionRouter.get(
    "/toeic/sessions/:sessionId/result",
    toeicExamSessionController.getResult
);

export default toeicExamSessionRouter;
