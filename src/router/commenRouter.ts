import { Router } from "express";
import { CommentController } from "../controller/CommentController";
import { AuthController } from "../controller/authController";

const commentRouter = Router();


const commentController = new CommentController();
const authController = new AuthController();

commentRouter.use(authController.protect);
commentRouter.post("/lectures/:lectureId/comments", commentController.createComment);
commentRouter.get("/lectures/:lectureId/comments", commentController.getCommentsByLectureId);
commentRouter.post("/comments/:commentId/like", commentController.toggleLike);

export default commentRouter;
