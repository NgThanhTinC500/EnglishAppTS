import { Router } from "express";
import { CourseController } from "../controller/CourseController";
import { AuthController } from "../controller/authController";


const courseRouter = Router();
const courseController = new CourseController();
const authController = new AuthController();

courseRouter.post("/courses", authController.protect, authController.restrictTo("admin"), courseController.createCourse);
courseRouter.get("/courses",  authController.protect, authController.restrictTo("admin"),courseController.getAllCourses);
courseRouter.get("/courses/:courseId", authController.protect, authController.restrictTo("admin"), courseController.getCourseDetail);
courseRouter.patch("/courses/:courseId", authController.protect, authController.restrictTo("admin"), courseController.updateCourse);
courseRouter.delete("/courses/:courseId", authController.protect, authController.restrictTo("admin"), courseController.deleteCourse);


export default courseRouter;