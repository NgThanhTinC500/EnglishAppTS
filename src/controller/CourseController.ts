import { Request, Response } from "express";
import { CourseService } from "../service/courseService";
import catchAsync from "../utils/catchAsync";

export class CourseController {
    private courseService: CourseService;

    constructor() {
        this.courseService = new CourseService();
    }

    createCourse = catchAsync(async (req: Request, res: Response) => {
        const courseData = req.body;
        const newCourse = await this.courseService.createCourse(courseData);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: newCourse
        });
    });

    getAllCourses = catchAsync(async (_req: Request, res: Response) => {
        const courses = await this.courseService.getAllCourses();

        res.status(200).json({
            success: true,
            message: "Courses retrieved successfully",
            courses
        });
    });

    getCourseDetail = catchAsync(async (req: Request, res: Response) => {
        const id = Number(req.params.courseId);
        const course = await this.courseService.getCourseById(id);

        res.status(200).json({
            success: true,
            message: "Course retrieved successfully",
            course
        });
    });

    updateCourse = catchAsync(async (req: Request, res: Response) => {
        const id = Number(req.params.courseId);
        const updateData = req.body;

        const updatedCourse = await this.courseService.updateCourse(id, updateData);

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: updatedCourse
        });
    });

    deleteCourse = catchAsync(async (req: Request, res: Response) => {
        const id = Number(req.params.courseId);
        await this.courseService.deleteCourse(id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    });
}