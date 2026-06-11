import { Router } from "express";
import { AuthController } from "../controller/authController";
import { BlogController } from "../controller/blogController";
import { uploadImage } from "../middlewares/uploadImage";
import { BlogService } from "../service/blogService";

const blogRouter = Router();
const authController = new AuthController();
const blogController = new BlogController(new BlogService());

blogRouter.get("/blogs", blogController.getAllBlogs);
blogRouter.get("/blogs/:id", blogController.getBlogById);

blogRouter.get("/admin/blogs", authController.protect, authController.restrictTo("admin"), blogController.getAllBlogsForAdmin);
blogRouter.post("/admin/blogs", authController.protect, authController.restrictTo("admin"), uploadImage.single("image"), blogController.createBlog);
blogRouter.patch("/admin/blogs/:id", authController.protect, authController.restrictTo("admin"), uploadImage.single("image"), blogController.updateBlog);
blogRouter.patch("/admin/blogs/:id/status", authController.protect, authController.restrictTo("admin"), blogController.deleteBlog);

export default blogRouter;
