import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Notification } from "../entity/Notification";
import { AppError } from "../utils/appError";

type PaginationInput = {
    page?: number;
    limit?: number;
};

export class NotificationService {
    private notificationRepository: Repository<Notification>;

    constructor() {
        this.notificationRepository = AppDataSource.getRepository(Notification);
    }

    private getPagination({ page = 1, limit = 20 }: PaginationInput) {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 20;

        return {
            page: safePage,
            limit: safeLimit,
            skip: (safePage - 1) * safeLimit,
        };
    }

    async getNotifications(userId: string, input: PaginationInput) {
        const { page, limit, skip } = this.getPagination(input);
        const [notifications, total] = await this.notificationRepository.findAndCount({
            where: { userId },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
        });

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async markAsRead(userId: string, notificationId: number) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new AppError("Không tìm thấy thông báo", 404);
        }

        notification.isRead = true;
        return this.notificationRepository.save(notification);
    }
}
