import { Request, Response } from "express";
import { ExamService } from "../service/examService";
import * as fs from "fs";
import catchAsync from "../utils/catchAsync";


export class ExamController {
    private examService = new ExamService();
    // constructor(private examService: ExamService) {

    //  }
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

    getAllExams = catchAsync(async (req: Request, res: Response) => {
        const topicId = Number(req.params.topicId);
        const exams = await this.examService.getAllExams(topicId);
        res.status(200).json({
            success: true,
            size: exams.length,
            data: exams
        });
    })

    // Controller
    getExamById = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examId = Number(req.params.id)
        const exam = await this.examService.getExamById(examId)
        if (!exam) {
            res.status(404).json({
                success: false,
                message: "exam not found"
            })
            return;
        }
        res.status(200).json({
            success: true,
            data: exam
        })
    })

    // 
    deleteExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examId = Number(req.params.id);
        await this.examService.deleteExam(examId);

        res.json({
            success: true,
            message: "Exam deleted successfully"
        })
    })

    updateExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const examId = Number(req.params.id);
        const updateData = req.body;

        const exam = await this.examService.updateExam(examId, updateData);
        if (!exam) {
            res.json({
                success: false,
                message: "Exam not found"
            })
            return;
        }
        res.json({
            success: true,
            data: exam,
            message: "Update thanh cong"
        })
    })

    // PUT /api/questions/:id - Cập nhật câu hỏi


    // async updateQuestion(req: Request, res: Response) {
    //     const questionId = Number(req.params.id);
    //     const updateData = req.body;
    //     if (!questionId) {
    //         return res.status(404).json({
    //             success: false,
    //             message: "Không có exam này"
    //         });
    //     }
    //     const exam = await this.examService.updateQuestion(questionId, updateData)
    //     res.status(200).json({
    //         success: true,
    //         message: "update thanh cong",
    //         data: exam
    //     })
    // }
    // async deleteQuestion(req: Request, res: Response) {
    //     const questionId = Number(req.params.id);
    //     const deleted = await this.examService.deleteQuestion(questionId)
    //     if (!deleted) {
    //         res.status(404).json({
    //             success: false,
    //             message: "Question not found"
    //         })
    //         return
    //     }
    //     res.json({
    //         success: true,
    //         message: "Question deleted successfully"
    //     });

    // }
    // // Lấy câu hỏi theo đề thi
    // async getQuestionByExamID(req: Request, res: Response): Promise<void> {
    //     const examId = Number(req.params.examId);
    //     if (!examId) {
    //         res.status(400).json({
    //             success: false,
    //             message: "Invalid exam ID"
    //         });
    //         return;
    //     }
    //     const examwithQuestion = await this.examService.getExamWithQuestions(examId)
    //     res.json({
    //         success: true,
    //         data: examwithQuestion
    //     });
    // }

    // // async addListeningQuestion(req: Request, res: Response): Promise<void> {
    // //     try {
    // //         const examId = Number(req.params.id);
    // //         if (isNaN(examId)) {
    // //             res.status(400).json({
    // //                 success: false,
    // //                 message: "Invalid exam ID"
    // //             });
    // //             return;
    // //         }
    // //         // Kiểm tra file audio đã upload
    // //         // sau khi upload file = multer, lưu vào req.file
    // //         if (!req.file) {
    // //             res.status(400).json({
    // //                 success: false,
    // //                 message: "Audio file is required"
    // //             });
    // //             return;
    // //         }

    // //         console.log(req.file)

    // //         // Parse answers từ JSON string (vì FormData gửi lên)
    // //         let answers;
    // //         try {
    // //             answers = JSON.parse(req.body.answers);
    // //         } catch (error) {
    // //             res.status(400).json({
    // //                 success: false,
    // //                 message: "Invalid answers format"
    // //             });
    // //             return;
    // //         }
    // //         // ở phía trên này xử lí upload file xong rồi
    // //         // phía dưới sẽ sử dụng properties của filename

    // //         // client up file, server lưu vào folder public/audio
    // //         // tạo audioURL => url công khai, client truy cập


    // //         // Tạo URL cho audio file
    // //         // req.file.filename: khi dung multer, upload thanh cong tạo object req.file
    // //         const audioUrl = `/uploads/audio/${req.file.filename}`;
    // //         const questionData = {
    // //             examId,
    // //             questionText: req.body.questionText,
    // //             // orderNumber: parseInt(req.body.orderNumber),
    // //             explanation: req.body.explanation,
    // //             audioUrl: audioUrl, // lấy từ audioUrl cập nhật vào
    // //             audioFileName: req.file.originalname,
    // //             // audioDuration: req.body.audioDuration ? parseInt(req.body.audioDuration) : undefined,
    // //             transcript: req.body.transcript,
    // //             showTranscript: req.body.showTranscript === 'true',
    // //             answers: answers
    // //         };

    // //         const question = await examService.addListeningQuestion(questionData);

    // //         res.status(201).json({
    // //             success: true,
    // //             data: question,
    // //             message: "Listening question added successfully"
    // //         });
    // //     } catch (error: any) {
    // //         // Xóa file đã upload nếu có lỗi
    // //         if (req.file) {
    // //             try {
    // //                 fs.unlinkSync(req.file.path);
    // //             } catch (e) {
    // //                 console.error("Failed to delete uploaded file:", e);
    // //             }
    // //         }

    // //         res.status(500).json({
    // //             success: false,
    // //             message: error.message || "Internal server error"
    // //         });
    // //     }
    // // }
    // async deleteQuestionListening(req: Request, res: Response): Promise<void> {
    //     try {
    //         const questionId = Number(req.params.id);

    //         if (isNaN(questionId)) {
    //             res.status(400).json({
    //                 success: false,
    //                 message: "Invalid question ID"
    //             });
    //             return;
    //         }

    //         const deleted = await this.examService.deleteQuestionWithAudio(questionId);

    //         if (!deleted) {
    //             res.status(404).json({
    //                 success: false,
    //                 message: "Question not found"
    //             });
    //             return;
    //         }

    //         res.json({
    //             success: true,
    //             message: "Question deleted successfully"
    //         });
    //     } catch (error: any) {
    //         res.status(500).json({
    //             success: false,
    //             message: error.message || "Internal server error"
    //         });
    //     }
    // }
    // async updateQuestionAudio(req: Request, res: Response): Promise<void> {
    //     try {
    //         const questionId = Number(req.params.id);

    //         if (isNaN(questionId)) {
    //             res.status(400).json({
    //                 success: false,
    //                 message: "Invalid question ID"
    //             });
    //             return;
    //         }

    //         if (!req.file) {
    //             res.status(400).json({
    //                 success: false,
    //                 message: "Audio file is required"
    //             });
    //             return;
    //         }

    //         const audioUrl = `/uploads/audio/${req.file.filename}`;
    //         const audioDuration = req.body.audioDuration ? parseInt(req.body.audioDuration) : undefined;

    //         const question = await this.examService.updateQuestionAudio(
    //             questionId,
    //             audioUrl,
    //             req.file.originalname,
    //             audioDuration
    //         );

    //         if (!question) {
    //             // Xóa file vừa upload nếu question không tồn tại
    //             fs.unlinkSync(req.file.path);

    //             res.status(404).json({
    //                 success: false,
    //                 message: "Question not found"
    //             });
    //             return;
    //         }

    //         res.json({
    //             success: true,
    //             data: question,
    //             message: "Audio updated successfully"
    //         });
    //     } catch (error: any) {
    //         // Xóa file đã upload nếu có lỗi
    //         if (req.file) {
    //             try {
    //                 fs.unlinkSync(req.file.path);
    //             } catch (e) {
    //                 console.error("Failed to delete uploaded file:", e);
    //             }
    //         }

    //         res.status(500).json({
    //             success: false,
    //             message: error.message || "Internal server error"
    //         });
    //     }
    // }


}

