import { Router } from "express";
import { LectureController } from "../controller/lectureController";
import { AuthController } from "../controller/authController";

const LectureRoutes = Router();
const lectureController = new LectureController();
const authController = new AuthController();



LectureRoutes.get("/lessons/:lessonId/lectures", lectureController.getAllLecturesByLessonId);
LectureRoutes.get("/lectures/:lectureId", lectureController.getLectureDetail);

// LectureRoutes.use(authController.protect);
LectureRoutes.post("/lessons/:lessonId/lectures", lectureController.createLecture);
LectureRoutes.patch("/lectures/:lectureId", lectureController.updateLecture);
LectureRoutes.delete("/lectures/:lectureId", lectureController.deleteLecture);



export default LectureRoutes;  