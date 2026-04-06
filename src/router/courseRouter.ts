import { Router } from "express";
import { CourseController } from "../controller/CourseController";


const courseRouter = Router();
const courseController = new CourseController();

courseRouter.post("/courses", courseController.createCourse);
courseRouter.get("/courses", courseController.getAllCourses);
courseRouter.get("/courses/:courseId", courseController.getCourseDetail);
courseRouter.patch("/courses/:courseId", courseController.updateCourse);
courseRouter.delete("/courses/:courseId", courseController.deleteCourse);


export default courseRouter;