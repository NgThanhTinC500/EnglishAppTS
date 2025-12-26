import { Request, Response } from "express";
import { ExamService } from "../service/examService";
import multer from "multer";
import * as fs from "fs";

const examService = new ExamService();
export class ExamController {

    static async createExams(req: Request, res: Response): Promise<void> {
        const examData = req.body;
        const exam = await examService.createExam(examData);

        res.status(201).json({
            success: true,
            data: exam,
            message: "Exam created successfully"
        });
    }

    static async getAllExams(req: Request, res: Response) {
        const exams = await examService.getAllExams();
        res.status(200).json({
            success: true,
            data: exams
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

    static async addListeningQuestion(req: Request, res: Response): Promise<void> {
        try {
            const examId = parseInt(req.params.id);
            if (isNaN(examId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid exam ID"
                });
                return;
            }
            // Kiểm tra file audio đã upload
            // sau khi upload file = multer, lưu vào req.file
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "Audio file is required"
                });
                return;
            }

            console.log(req.file)

            // Parse answers từ JSON string (vì FormData gửi lên)
            let answers;
            try {
                answers = JSON.parse(req.body.answers);
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: "Invalid answers format"
                });
                return;
            }
            // ở phía trên này xử lí upload file xong rồi
            // phía dưới sẽ sử dụng properties của filename

            // client up file, server lưu vào folder public/audio
            // tạo audioURL => url công khai, client truy cập


            // Tạo URL cho audio file
            // req.file.filename: khi dung multer, upload thanh cong tạo object req.file
            const audioUrl = `/uploads/audio/${req.file.filename}`;
            const questionData = {
                examId,
                questionText: req.body.questionText,
                // orderNumber: parseInt(req.body.orderNumber),
                explanation: req.body.explanation,
                audioUrl: audioUrl, // lấy từ audioUrl cập nhật vào
                audioFileName: req.file.originalname,
                // audioDuration: req.body.audioDuration ? parseInt(req.body.audioDuration) : undefined,
                transcript: req.body.transcript,
                showTranscript: req.body.showTranscript === 'true',
                answers: answers
            };

            const question = await examService.addListeningQuestion(questionData);

            res.status(201).json({
                success: true,
                data: question,
                message: "Listening question added successfully"
            });
        } catch (error: any) {
            // Xóa file đã upload nếu có lỗi
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {
                    console.error("Failed to delete uploaded file:", e);
                }
            }

            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }
    static async deleteQuestionListening(req: Request, res: Response): Promise<void> {
        try {
            const questionId = parseInt(req.params.id);

            if (isNaN(questionId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid question ID"
                });
                return;
            }

            const deleted = await examService.deleteQuestionWithAudio(questionId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
                return;
            }

            res.json({
                success: true,
                message: "Question deleted successfully"
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }
    static async updateQuestionAudio(req: Request, res: Response): Promise<void> {
        try {
            const questionId = parseInt(req.params.id);

            if (isNaN(questionId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid question ID"
                });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "Audio file is required"
                });
                return;
            }

            const audioUrl = `/uploads/audio/${req.file.filename}`;
            const audioDuration = req.body.audioDuration ? parseInt(req.body.audioDuration) : undefined;

            const question = await examService.updateQuestionAudio(
                questionId,
                audioUrl,
                req.file.originalname,
                audioDuration
            );

            if (!question) {
                // Xóa file vừa upload nếu question không tồn tại
                fs.unlinkSync(req.file.path);

                res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
                return;
            }

            res.json({
                success: true,
                data: question,
                message: "Audio updated successfully"
            });
        } catch (error: any) {
            // Xóa file đã upload nếu có lỗi
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {
                    console.error("Failed to delete uploaded file:", e);
                }
            }

            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    }


}

