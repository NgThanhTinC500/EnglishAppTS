import { Request, Response } from "express";
import { HistoryService } from "../service/historyService";

const historyService = new HistoryService();

export class HistoryController {
    static formatTime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        return `${h.toString().padStart(2, "0")}:` +
            `${m.toString().padStart(2, "0")}:` +
            `${s.toString().padStart(2, "0")}`;
    }

    static async getExamHistory(req: Request, res: Response) {
        const userId = req.user.id;

        const history = await historyService.getUserExamHistory(userId);

        const result = history.map((item) => ({
            attemptId: item.id,
            examName: item.exam?.title,
            date: item.createdAt.toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh"
            }),

            score: item.score,
            timeSpent: item.timeSpent ? HistoryController.formatTime(item.timeSpent) : "00:00:00",
            status: item.status
        }));


        return res.json({ history: result });
    }

}