import { Router } from "express";
import { BlogController } from "../controller/blogController";
import { uploadImage } from "../middlewares/uploadImage";

const blogRouter = Router();

// route blog
blogRouter.post("/create", uploadImage.single("image"), BlogController.createBlog);
blogRouter.get("/get-all", BlogController.getAllBlogs);
blogRouter.patch("/update/:id", uploadImage.single("image"), BlogController.updateBlog);
blogRouter.patch("/delete/:id", BlogController.deleteBlog);    

export default blogRouter;