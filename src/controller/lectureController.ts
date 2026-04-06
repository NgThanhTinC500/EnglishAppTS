import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { LectureService } from "../service/lectureService";

export class LectureController {
    private lectureService: LectureService;

    constructor() {
        this.lectureService = new LectureService();
    }

    createLecture = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);

        if (isNaN(lessonId)) {
            throw new Error("Invalid lesson id");
        }

        const lectureData = req.body;
        const newLecture = await this.lectureService.createLecture(lessonId, lectureData);

        res.status(201).json({
            success: true,
            message: "Lecture created successfully",
            lecture: newLecture
        });
    });

    getAllLecturesByLessonId = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);

        if (isNaN(lessonId)) {
            throw new Error("Invalid lesson id");
        }

        const lectures = await this.lectureService.getLecturesByLesson(lessonId);

        res.status(200).json({
            success: true,
            message: "Lectures retrieved successfully",
            lectures
        });
    });

    getLectureDetail = catchAsync(async (req: Request, res: Response) => {
        // const lessonId = Number(req.params.lessonId);
        const lectureId = Number(req.params.lectureId);

        // if (isNaN(lectureId)) {
        //     throw new Error("Invalid id");
        // }

        const lecture = await this.lectureService.getLectureById(lectureId);

        res.status(200).json({
            success: true,
            message: "Lecture retrieved successfully",
            lecture
        });
    });

    updateLecture = catchAsync(async (req: Request, res: Response) => {
        const lessonId = Number(req.params.lessonId);
        const lectureId = Number(req.params.lectureId);

        if (isNaN(lessonId) || isNaN(lectureId)) {
            throw new Error("Invalid id");
        }

        const updateData = req.body;
        const updatedLecture = await this.lectureService.updateLecture(
            lessonId,
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
        const lessonId = Number(req.params.lessonId);
        const lectureId = Number(req.params.lectureId);

        if (isNaN(lessonId) || isNaN(lectureId)) {
            throw new Error("Invalid id");
        }

        await this.lectureService.deleteLecture(lessonId, lectureId);

        res.status(200).json({
            success: true,
            message: "Lecture deleted successfully"
        });
    });
}