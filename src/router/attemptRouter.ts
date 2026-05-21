import { Router } from "express";
import { AttemptController } from "../controller/AttemptController";
import { AuthController } from "../controller/authController";

const attemptRouter = Router();
const attemptController = new AttemptController();
const authController = new AuthController();

attemptRouter.use(authController.protect);
attemptRouter.post("/exams/:examId/startExam", attemptController.startExam);
attemptRouter.post("/attempts/:attemptId/answer", attemptController.answerQuestion);
attemptRouter.post("/attempts/:attemptId/dictation-answer", attemptController.answerDictation);
attemptRouter.post("/exams/:examId/attempts/:attemptId/submitExam", attemptController.submitExam);

export default attemptRouter;
