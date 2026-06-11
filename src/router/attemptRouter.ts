import { Router } from "express";
import { AttemptController } from "../controller/AttemptController";
import { AuthController } from "../controller/authController";

const attemptRouter = Router();

const attemptController = new AttemptController();
const authController = new AuthController();

attemptRouter.post("/exams/:examId/startExam", authController.protect, attemptController.startExam);
attemptRouter.post("/attempts/:attemptId/answer", authController.protect, attemptController.answerQuestion);
attemptRouter.post("/attempts/:attemptId/dictation-answer", authController.protect, attemptController.answerDictation);
attemptRouter.post("/exams/:examId/attempts/:attemptId/submitExam", authController.protect, attemptController.submitExam);

export default attemptRouter;
