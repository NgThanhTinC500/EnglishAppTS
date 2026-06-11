import { Router } from "express";
import { LessonController } from "../controller/LessonController";
import { AuthController } from "../controller/authController";

const lessonRoutes = Router();
const lessonController = new LessonController();
const authController = new AuthController();

lessonRoutes.post("/courses/:courseId/lessons", authController.protect, authController.restrictTo("admin"), lessonController.createLesson);
lessonRoutes.get("/courses/:courseId/lessons", lessonController.getAllLessonsByCourseId);
lessonRoutes.get("/lessons/:lessonId", authController.protect, authController.restrictTo("admin"), lessonController.getLessonDetail);
lessonRoutes.patch("/lessons/:lessonId", authController.protect, authController.restrictTo("admin"), lessonController.updateLesson);
lessonRoutes.delete("/lessons/:lessonId", authController.protect, authController.restrictTo("admin"), lessonController.deleteLesson);

export default lessonRoutes;