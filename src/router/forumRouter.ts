import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ForumController } from "../controller/forumController";

const forumRouter = Router();
const authController = new AuthController();
const forumController = new ForumController();

forumRouter.get("/posts", forumController.getPosts);
forumRouter.get("/posts/:id", forumController.getPostById);
forumRouter.get("/posts/:id/comments", forumController.getComments);

forumRouter.get(
    "/admin/posts",
    authController.protect,
    authController.restrictTo("admin"),
    forumController.getAdminPosts
);
forumRouter.patch(
    "/admin/posts/:id/visibility",
    authController.protect,
    authController.restrictTo("admin"),
    forumController.setPostVisibility
);

forumRouter.post("/posts", authController.protect, forumController.createPost);
forumRouter.patch("/posts/:id", authController.protect, forumController.updatePost);
forumRouter.delete("/posts/:id", authController.protect, forumController.deletePost);
forumRouter.post("/posts/:id/like", authController.protect, forumController.likePost);
forumRouter.post("/posts/:id/comments", authController.protect, forumController.createComment);
forumRouter.patch(
    "/comments/:commentId",
    authController.protect,
    forumController.updateComment
);
forumRouter.delete(
    "/comments/:commentId",
    authController.protect,
    forumController.deleteComment
);

export default forumRouter;
