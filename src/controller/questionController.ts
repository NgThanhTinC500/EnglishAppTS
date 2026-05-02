import { Request, Response } from "express";
import { QuestionService } from "../service/questionService";
import catchAsync from "../utils/catchAsync";

export class QuestionController {
    private questionService = new QuestionService();

    createQuestion = catchAsync(async (req: Request, res: Response) => {
        const result = await this.questionService.createQuestion(req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: "Question created successfully"
        });
    });

    getAllQuestions = catchAsync(async (req: Request, res: Response) => {
        const result = await this.questionService.getAllQuestion();
        res.status(200).json({
            success: true,
            total: result.length,
            data: result,
            message: "Get all questions successfully"
        });
    });

    getQuestionDetail = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        if (isNaN(questionId)) {
            res.status(400).json({ success: false, message: "Invalid questionId" });
            return;
        }
        const result = await this.questionService.getQuestionDetail(questionId);
        res.status(200).json({
            success: true,
            data: result,
            message: "Get question detail successfully"
        });
    });

    getDictationQuestion = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        if (isNaN(questionId)) {
            res.status(400).json({ success: false, message: "Invalid questionId" });
            return;
        }
        const result = await this.questionService.getDictationQuestion(questionId);
        res.status(200).json({
            success: true,
            data: result,
            message: "Get dictation question successfully"
        });
    });

    submitDictationAnswer = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.body.questionId);
        if (isNaN(questionId)) {
            res.status(400).json({ success: false, message: "Invalid questionId" });
            return;
        }
        const result = await this.questionService.submitDictationAnswer(questionId, req.body.answers);
        res.status(200).json({
            success: true,
            data: result,
            message: "Submit dictation answer successfully"
        });
    });

    updateQuestion = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        if (isNaN(questionId)) {
            res.status(400).json({ success: false, message: "Invalid questionId" });
            return;
        }
        const result = await this.questionService.updateQuestion(questionId, req.body);
        res.status(200).json({
            success: true,
            data: result,
            message: "Question updated successfully"
        });
    });

    deleteQuestion = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        if (isNaN(questionId)) {
            res.status(400).json({ success: false, message: "Invalid questionId" });
            return;
        }
        await this.questionService.deleteQuestion(questionId);
        res.status(200).json({
            success: true,
            data: null,
            message: "Question deleted successfully"
        });
    });
}
