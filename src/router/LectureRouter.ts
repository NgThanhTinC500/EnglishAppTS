import { Router } from "express";
import { LectureController } from "../controller/lectureController";
import { AuthController } from "../controller/authController";


const LectureRoutes = Router();
const lectureController = new LectureController();
const authController = new AuthController();


LectureRoutes.get("/lessons/:lessonId/lectures", authController.protect, lectureController.getAllLecturesByLessonId);
LectureRoutes.get("/lectures/:lectureId", authController.protect, lectureController.getLectureDetail);
LectureRoutes.post("/lessons/:lessonId/lectures", authController.protect, authController.restrictTo("admin"), lectureController.createLecture);
LectureRoutes.patch("/lectures/:lectureId", authController.protect, authController.restrictTo("admin"), lectureController.updateLecture);
LectureRoutes.delete("/lectures/:lectureId", authController.protect, authController.restrictTo("admin"), lectureController  .deleteLecture);



export default LectureRoutes;  