import { Router } from "express";
import { CommentController } from "../controller/CommentController";

const commentRouter = Router();


const commentController = new CommentController();

commentRouter.post("/lectures/:lectureId/comments", commentController.createComment);
commentRouter.get("/lectures/:lectureId/comments", commentController.getCommentsByLectureId);

export default commentRouter;