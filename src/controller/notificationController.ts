import { Request, Response } from "express";
import { NotificationService } from "../service/notificationService";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/appError";

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    private parseId(id: unknown) {
        if (typeof id !== "string") {
            throw new AppError("notificationId không hợp lệ", 400);
        }

        const parsedId = Number(id);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            throw new AppError("notificationId không hợp lệ", 400);
        }

        return parsedId;
    }

    getNotifications = catchAsync(async (req: Request, res: Response) => {
        const result = await this.notificationService.getNotifications(req.user.id, {
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 20),
        });

        res.status(200).json({
            status: "success",
            results: result.notifications.length,
            pagination: result.pagination,
            data: { notifications: result.notifications },
        });
    });

    markAsRead = catchAsync(async (req: Request, res: Response) => {
        const notificationId = this.parseId(req.params.id);
        const notification = await this.notificationService.markAsRead(req.user.id, notificationId);

        res.status(200).json({
            status: "success",
            data: { notification },
        });
    });
}
