import { Request, Response } from "express";
import { ExamService } from "../service/examService";

const examService = new ExamService();
export class ExamController {

    static async getAllExams(req: Request, res: Response) {
        const exams = await examService.getAllExams();
        res.status(200).json({
            success: true,
            data: exams
        });
    }

    static async createExams(req: Request, res: Response): Promise<void> {
        const examData = req.body;
        const exam = await examService.createExam(examData);

        res.status(201).json({
            success: true,
            data: exam,
            message: "Exam created successfully"
        });
    }

    // Controller
    static async getExamById(req: Request, res: Response): Promise<void> {
        const examId = req.params.id
        const exam = await examService.getExamById(examId)
        if (!exam) {
            res.status(404).json({
                success: false,
                message: "exam not found"
            })
        }
        res.status(200).json({
            success: true,
            data: exam
        })
    }

    // 
    static async deleteExam(req: Request, res: Response): Promise<void> {
        const examId = req.params.id
        const exam = await examService.deleteExam(examId)

        res.json({
            success: true,
            message: "Exam deleted successfully"
        })
    }

    static async updateExam(req: Request, res: Response): Promise<void> {
        const examId = req.params.id
        const updateData = req.body;

        const exam = await examService.updateExam(examId, updateData);
        if (!exam) {
            res.json({
                success: false,
                message: "Exam not found"
            })
        }
        res.json({
            success: true,
            data: exam,
            message: "Update thanh cong"
        })
    }

    static async addQuestion(req: Request, res: Response): Promise<void> {
        const examId = req.params.id; // UUID của exam
        if (!examId) {
            return res.status(404).json({
                success: false,
                message: "Không có exam này"
            });
        }

        const questionData = { ...req.body, examId };

        try {
            const question = await examService.addQuestion(questionData);
            res.status(201).json({
                success: true,
                data: question,
                message: "Add question successful"
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "Something went wrong"
            });
        }
    }
    // PUT /api/questions/:id - Cập nhật câu hỏi
    static async updateQuestion(req: Request, res: Response): Promise<void> {
        const questionId = req.params.id;
        const updateData = req.body;
        if (!questionId) {
            return res.status(404).json({
                success: false,
                message: "Không có exam này"
            });
        }
        const exam = await examService.updateQuestion(questionId, updateData)
        res.status(200).json({
            success: true,
            message: "update thanh cong",
            data: exam
        })
    }
    static async deleteQuestion(req: Request, res: Response) {
        const questionId = req.params.id;
        const deleted = await examService.deleteQuestion(questionId)
        if (!deleted) {
            res.status(404).json({
                success: false,
                message: "Question not found"
            })
            return
        }
        res.json({
            success: true,
            message: "Question deleted successfully"
        });

    }
    // Lấy câu hỏi theo đề thi
    static async getQuestionByExamID(req: Request, res: Response): Promise<void> {
        const examId = parseInt(req.params.examId);
        if (!examId) {
            res.status(400).json({
                success: false,
                message: "Invalid exam ID"
            });
            return;
        }
        const examwithQuestion = await examService.getExamWithQuestions(examId)
        res.json({
            success: true,
            data: examwithQuestion
        });
    }


}

