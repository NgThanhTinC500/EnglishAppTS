import { Router } from "express";
import { TopicController } from "../controller/TopicController";
import { ExamController } from "../controller/examController";

const topicRouter = Router();
const examController = new ExamController();
const topicController = new TopicController();

// TOPIC
topicRouter.post("/topics", topicController.createTopic);
topicRouter.patch("/topics/:topicId", topicController.updateTopic);
topicRouter.delete("/topics/:topicId", topicController.deleteTopic);
topicRouter.get("/topics", topicController.getAllTopic);

// EXAM
topicRouter.post("/topics/:topicId/exams", examController.createExams)
topicRouter.get("/topics/:topicId/exams", examController.getAllExamsByTopicId)
topicRouter.get("/topics/:topicId/exams/:examId", examController.getExamDetail)
topicRouter.patch("/topics/:topicId/exams/:examId/active", examController.toggleExamActive)
topicRouter.patch("/topics/:topicId/exams/:examId", examController.updateExam)

export default topicRouter;
