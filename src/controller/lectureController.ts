import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { LectureService } from "../service/lectureService";
import { AppError } from "../utils/appError";

export class LectureController {
    private lectureService: LectureService;

    constructor() {
        this.lectureService = new LectureService();
    }

    private parseId(value: string | string[] | undefined, fieldName: string) {
        if (typeof value !== "string") {
            throw new AppError(`${fieldName} không hợp lệ`, 400);
        }

        const id = Number(value);

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError(`${fieldName} không hợp lệ`, 400);
        }

        return id;
    }

    createLecture = catchAsync(async (req: Request, res: Response) => {
        const lessonId = this.parseId(req.params.lessonId, "lessonId");

        const lectureData = req.body;
        const newLecture = await this.lectureService.createLecture(lessonId, lectureData);

        res.status(201).json({
            success: true,
            message: "Lecture created successfully",
            lecture: newLecture
        });
    });

    getAllLecturesByLessonId = catchAsync(async (req: Request, res: Response) => {
        const lessonId = this.parseId(req.params.lessonId, "lessonId");

        const lectures = await this.lectureService.getLecturesByLesson(lessonId);

        res.status(200).json({
            success: true,
            message: "Lectures retrieved successfully",
            lectures
        });
    });

    getLectureDetail = catchAsync(async (req: Request, res: Response) => {
        const lectureId = this.parseId(req.params.lectureId, "lectureId");

        const lecture = await this.lectureService.getLectureById(lectureId);

        res.status(200).json({
            success: true,
            message: "Lecture retrieved successfully",
            lecture
        });
    });

    updateLecture = catchAsync(async (req: Request, res: Response) => {
        const lectureId = this.parseId(req.params.lectureId, "lectureId");

        const updateData = req.body;
        const updatedLecture = await this.lectureService.updateLecture(
            lectureId,
            updateData
        );

        res.status(200).json({
            success: true,
            message: "Lecture updated successfully",
            lecture: updatedLecture
        });
    });

    deleteLecture = catchAsync(async (req: Request, res: Response) => {
        const lectureId = this.parseId(req.params.lectureId, "lectureId");

        await this.lectureService.deleteLecture(lectureId);

        res.status(200).json({
            success: true,
            message: "Lecture deleted successfully"
        });
    });
}
