import { Router } from "express";
import { BlogController } from "../controller/blogController";
import { uploadImage } from "../middlewares/uploadImage";
import { BlogService } from "../service/blogService";

const blogRouter = Router();
const blogController = new BlogController(new BlogService());
// route blog
blogRouter.post("/create", uploadImage.single("image"), blogController.createBlog);
blogRouter.get("/get-all", blogController.getAllBlogs);
blogRouter.patch("/update/:id", uploadImage.single("image"), blogController.updateBlog);
blogRouter.patch("/delete/:id", blogController.deleteBlog);

export default blogRouter;