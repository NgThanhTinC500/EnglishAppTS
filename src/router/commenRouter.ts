import { Router } from "express";
import { CommentController } from "../controller/CommentController";
import { AuthController } from "../controller/authController";

const commentRouter = Router();

const commentController = new CommentController();
const authController = new AuthController();

commentRouter.post("/lectures/:lectureId/comments", authController.protect, commentController.createComment);
commentRouter.get("/lectures/:lectureId/comments", authController.protect, commentController.getCommentsByLectureId);
commentRouter.patch("/comments/:commentId", authController.protect, commentController.updateComment);
commentRouter.delete("/comments/:commentId", authController.protect, commentController.deleteComment);
commentRouter.post("/comments/:commentId/like", authController.protect, commentController.toggleLike);

export default commentRouter;
