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

blogRouter.use(authController.protect, authController.restrictTo("admin"));

blogRouter.get("/admin/blogs", blogController.getAllBlogsForAdmin);
blogRouter.post("/admin/blogs", uploadImage.single("image"), blogController.createBlog);
blogRouter.patch("/admin/blogs/:id", uploadImage.single("image"), blogController.updateBlog);
blogRouter.patch("/admin/blogs/:id/status", blogController.deleteBlog);

export default blogRouter;
