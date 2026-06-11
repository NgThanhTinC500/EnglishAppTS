import { Router } from "express";
import { AuthController } from "../controller/authController";
import { NotificationController } from "../controller/notificationController";

const notificationRouter = Router();
const authController = new AuthController();
const notificationController = new NotificationController();

notificationRouter.get("/", authController.protect, notificationController.getNotifications);
notificationRouter.patch("/:id/read", authController.protect, notificationController.markAsRead);

export default notificationRouter;
