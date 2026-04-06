import { Router } from "express";
import { LectureController } from "../controller/lectureController";

const LectureRoutes = Router();
const lectureController = new LectureController();

LectureRoutes.post("/lessons/:lessonId/lectures", lectureController.createLecture);
LectureRoutes.get("/lessons/:lessonId/lectures", lectureController.getAllLecturesByLessonId);
LectureRoutes.get("/lectures/:lectureId", lectureController.getLectureDetail);
LectureRoutes.patch("/lectures/:lectureId", lectureController.updateLecture);
LectureRoutes.delete("/lectures/:lectureId", lectureController.deleteLecture);



export default LectureRoutes;  