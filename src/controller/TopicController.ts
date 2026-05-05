import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { TopicService } from "../service/topicService";
import { TopicType } from "../entity/Topic"; // đường dẫn tới entity Topic
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
            message: "Topic updated successfully"
        })
    })

    deleteTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId)
        await this.topicService.deleteTopic(topicId)
        res.status(200).json({
            success: true,
            data: null,
            message: "Topic deleted successfully"
        })
    })

    getAllTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const type = req.query.type as TopicType | undefined;
        const topics = await this.topicService.getAllTopic(type);
        res.status(200).json({
            success: true,
            result: topics.length,
            data: topics,
            message: "Get all topics successfully",
        });
    });

}
