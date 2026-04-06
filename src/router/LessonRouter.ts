import { Router } from "express";
import { LessonController } from "../controller/LessonController";

const lessonRoutes = Router();
const lessonController = new LessonController();

lessonRoutes.post("/courses/:courseId/lessons", lessonController.createLesson);
lessonRoutes.get("/courses/:courseId/lessons", lessonController.getAllLessonsByCourseId);
lessonRoutes.get("/lessons/:lessonId", lessonController.getLessonDetail);
lessonRoutes.patch("/lessons/:lessonId", lessonController.updateLesson);
lessonRoutes.delete("/lessons/:lessonId", lessonController.deleteLesson);

export default lessonRoutes;