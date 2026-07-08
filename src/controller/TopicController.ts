import { Request, Response } from "express";

import { TopicType } from "../entity/Topic";
import { TopicService } from "../service/topicService";
import catchAsync from "../utils/catchAsync";

export class TopicController {
    private topicService = new TopicService();

    createTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topic = await this.topicService.createTopic(req.body);

        res.status(201).json({
            success: true,
            data: topic,
            message: "Tao topic thanh cong",
        });
    });

    updateTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId);
        const topic = await this.topicService.updateTopic(topicId, req.body);

        res.status(200).json({
            success: true,
            data: topic,
            message: "Cap nhat topic thanh cong",
        });
    });

    deleteTopic = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const topicId = Number(req.params.topicId);
        await this.topicService.deleteTopic(topicId);

        res.status(200).json({
            success: true,
            data: null,
            message: "Topic deleted successfully",
        });
    });

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
