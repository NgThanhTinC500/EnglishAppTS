import { Router } from "express";
import { BlogController } from "../controller/blogController";
import { uploadImage } from "../middlewares/uploadImage";
import { BlogService } from "../service/blogService";

const blogRouter = Router();
const blogController = new BlogController(new BlogService());
// route blog
blogRouter.post("/blogs", uploadImage.single("image"), blogController.createBlog);
blogRouter.get("/blogs", blogController.getAllBlogs);
blogRouter.patch("/blogs/:id", uploadImage.single("image"), blogController.updateBlog);
blogRouter.patch("/blogs/:id/status", blogController.deleteBlog);

export default blogRouter;