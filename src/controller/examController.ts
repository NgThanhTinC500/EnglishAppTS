import { Request, Response } from "express";
import { ExamService } from "../service/examService";
import * as fs from "fs";
import catchAsync from "../utils/catchAsync";


export class ExamController {
    private examService = new ExamService();

    createExams = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId)
        const examData = req.body;
        const exam = await this.examService.createExam(topicId, examData);

        res.status(201).json({
            success: true,
            data: exam,
            message: "Exam created successfully"
        });
    })

    getAllExamsByTopicId = catchAsync(async (req: Request, res: Response) => {
        const topicId = Number(req.params.topicId);
        const exams = await this.examService.getAllExams(topicId);
        res.status(200).json({
            success: true,
            size: exams.length,
            data: exams
        });
    })

    getExamDetail = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId);
        const examId = Number(req.params.examId)
        const exam = await this.examService.getExamDetail(topicId, examId)
        res.status(200).json({
            success: true,
            data: exam
        })
    })

    toggleExamActive = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId);
        const examId = Number(req.params.examId);
        await this.examService.toggleExamActive(topicId, examId);

        res.json({
            success: true,
            message: "Exam toggle active successfully"
        })
    })

    updateExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId);
        const examId = Number(req.params.examId);
        const updateData = req.body;
        const exam = await this.examService.updateExam(topicId, examId, updateData);
        res.json({
            success: true,
            data: exam,
            message: "Update thanh cong"
        })
    })

}

