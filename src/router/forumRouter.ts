import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ForumController } from "../controller/forumController";

const forumRouter = Router();
const authController = new AuthController();
const forumController = new ForumController();

forumRouter.get("/posts", forumController.getPosts);
forumRouter.get("/posts/:id", forumController.getPostById);
forumRouter.get("/posts/:id/comments", forumController.getComments);

forumRouter.post("/posts", authController.protect, forumController.createPost);
forumRouter.post("/posts/:id/like", authController.protect, forumController.likePost);
forumRouter.post("/posts/:id/comments", authController.protect, forumController.createComment);

export default forumRouter;
