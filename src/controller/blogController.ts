import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { BlogService } from "../service/blogService";
import multer from "multer";
import * as fs from "fs";


const blogService = new BlogService();

export class BlogController {

    static async getAllBlogs(req: Request, res: Response) {
        try {
            const blogs = await blogService.getAllBlogs();
            res.status(200).json(blogs);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    static async createBlog(req: Request, res: Response) {
        try {
            const { title, content, tag } = req.body;
            const imageFile = req.file;
            const newBlog = await blogService.createBlog({
                tag,
                title,
                content,
                image: imageFile ? imageFile.filename : null,
            });
            res.status(201).json(newBlog);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    static async updateBlog(req: Request, res: Response) {
        // To be implemented
        const blogId = parseInt(req.params.id);
        const { title, content, tag } = req.body;
        const imageFile = req.file;
        try {
            const updateData: any = {
                tag,
                title,
                content,
            };
            if (imageFile) {
                updateData.image = imageFile.filename;
            }
            const updatedBlog = await blogService.updateBlog(blogId, updateData);
            if (!updatedBlog) {
                return res.status(404).json({ message: "Blog not found" });
            }
            res.status(200).json(updatedBlog);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }

    }

    static async deleteBlog(req: Request, res: Response) {
        const blogId = parseInt(req.params.id);

        try {
            const deleted = await blogService.deleteBlog(blogId);

            if (!deleted) {
                return res.status(404).json({ message: "Blog not found" });
            }

            return res.json({ message: "Blog deleted (soft delete)" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    }



}