import { Router } from "express";
import { TopicController } from "../controller/TopicController";
import { ExamController } from "../controller/examController";
import { AttemptController } from "../controller/AttemptController";

const topicRouter = Router();
const examController = new ExamController();
const topicController = new TopicController();
const attemptController = new AttemptController();
// TOPIC
topicRouter.post("/topics", topicController.createTopic);
topicRouter.get("/topics", topicController.getAllTopic);

topicRouter.post("/topics/:topicId/exams", examController.createExams)
topicRouter.get("/topics/:topicId/exams", examController.getAllExams)

// START EXAM
topicRouter.post("/exams/:examId/startExam", attemptController.startExam)
topicRouter.post("/attempt/:attemptId/answer", attemptController.answerQuestion)
export default topicRouter;