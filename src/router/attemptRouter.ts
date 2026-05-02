import { Router } from "express";
import { AttemptController } from "../controller/AttemptController";

const attemptRouter = Router();
const attemptController = new AttemptController();

attemptRouter.post("/exams/:examId/startExam", attemptController.startExam);
attemptRouter.post("/attempts/:attemptId/answer", attemptController.answerQuestion);
attemptRouter.post("/attempts/:attemptId/dictation-answer", attemptController.answerDictation);
attemptRouter.post("/exams/:examId/attempts/:attemptId/submitExam", attemptController.submitExam);

export default attemptRouter;
