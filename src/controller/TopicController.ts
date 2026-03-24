import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { TopicService } from "../service/topicService";
export class TopicController {
    private topicService = new TopicService();

    createTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicData = req.body;
        const topic = await this.topicService.createTopic(topicData)
        res.status(201).json({
            success: true,
            data: topic,
            message: "Topic created successfully"
        });
    })
    
    updateTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId)
        const topicData = req.body;
        const topic = await this.topicService.updateTopic(topicId, topicData)
        res.status(200).json({
            success: true,
            data: topic,
            message: "TOPIC update successfull"
        })
    })
    getAllTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topics = await this.topicService.gellAllTopic()
        res.status(201).json({
            success: true,
            result: topics.length,
            data: topics,
            message: "Get all topic successfully"
        });
    })

}