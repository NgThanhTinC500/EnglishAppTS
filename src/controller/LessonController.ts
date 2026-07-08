import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { LessonService } from "../service/lessonService";

export class LessonController {
    private lessonService: LessonService;

    constructor() {
        this.lessonService = new LessonService();
    }

    createLesson = catchAsync(async (req: Request, res: Response) => {
        const courseId = Number(req.params.courseId);
        const lessonData = req.body;
        const newLesson = await this.lessonService.createLesson(courseId, lessonData);
        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            lesson: newLesson
        });
    });

    getAllLessonsByCourseId = catchAsync(async (req: Request, res: Response) => {
        const courseId = Number(req.params.courseId);

        const lessons = await this.lessonService.getLessonsByCourse(courseId);

        res.status(200).json({
            success: true,
            message: "Lessons retrieved successfully",
            lessons
        });
    });

    getLessonDetail = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);
        const lesson = await this.lessonService.getLessonById(lessonId);

        res.status(200).json({
            success: true,
            message: "Lesson retrieved successfully",
            lesson
        });
    });

    updateLesson = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);
        const updateData = req.body;

        const updatedLesson = await this.lessonService.updateLesson(
            lessonId,
            updateData
        );

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            lesson: updatedLesson
        });
    });

    deleteLesson = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);

        await this.lessonService.deleteLesson(lessonId);

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });
    });
}
