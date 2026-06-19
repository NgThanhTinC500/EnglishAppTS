import { Router } from "express";
import { TopicController } from "../controller/TopicController";
import { ExamController } from "../controller/examController";
import { AuthController } from "../controller/authController";

const topicRouter = Router();
const examController = new ExamController();
const topicController = new TopicController();
const authController = new AuthController();

// Public topic and exam reads
topicRouter.get("/topics", topicController.getAllTopic);
topicRouter.get("/topics/:topicId/exams", examController.getAllExamsByTopicId)
topicRouter.get(
    "/topics/:topicId/exams/:examId",
    authController.protect,
    authController.restrictTo("admin"),
    examController.getExamDetail
)

// TOPIC
topicRouter.post("/topics", authController.protect, authController.restrictTo("admin"), topicController.createTopic);
topicRouter.patch("/topics/:topicId", authController.protect, authController.restrictTo("admin"), topicController.updateTopic);
topicRouter.delete("/topics/:topicId", authController.protect, authController.restrictTo("admin"), topicController.deleteTopic);

// EXAM
topicRouter.post("/topics/:topicId/exams", authController.protect, authController.restrictTo("admin"), examController.createExams)
topicRouter.patch("/topics/:topicId/exams/:examId/active", authController.protect, authController.restrictTo("admin"), examController.toggleExamActive)
topicRouter.patch("/topics/:topicId/exams/:examId", authController.protect, authController.restrictTo("admin"), examController.updateExam)

export default topicRouter;
