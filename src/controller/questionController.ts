import { Request, Response } from "express";
import { QuestionService } from "../service/questionService"
import catchAsync from "../utils/catchAsync";


export class QuestionController {
    private questionService = new QuestionService();
    createQuestion = catchAsync(async (req: Request, res: Response) => {
        const questionData = req.body;
        const result = await this.questionService.createQuestion(questionData)
        res.status(201).json({
            succes: true,
            data: result,
            message: "Question created successfully"
        })
    })

    getAllQuestions = catchAsync(async (req: Request, res: Response) => {
        const result = await this.questionService.getAllQuestion()
        res.status(200).json({
            success: true,
            result,
            message: "Get all question successfully"
        })
    })

    getQuestionDetail = catchAsync(async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        const result = await this.questionService.getQuestionDetail(questionId)
        res.status(200).json({
            success: true,
            result,
            message: "Get question detail success"
        })
    })
} 