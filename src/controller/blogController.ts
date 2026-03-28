import { Request, Response } from 'express';
import { BlogService } from '../service/blogService';
import catchAsync from '../utils/catchAsync';

export class BlogController {
    constructor(private blogService: BlogService) { }

    getAllBlogs = catchAsync(async (req: Request, res: Response) => {
        const blogs = await this.blogService.getAllBlogs();
        res.status(200).json({
            status: 'success',
            results: blogs.length,
            data: { blogs },
        });
    });

    createBlog = catchAsync(async (req: Request, res: Response) => {
        const { title, content, tag } = req.body;
        const imageFile = req.file;

        const newBlog = await this.blogService.createBlog({
            tag,
            title,
            content,
            image: imageFile ? imageFile.filename : null,
        });

        res.status(201).json({
            status: 'success',
            data: { blog: newBlog },
        });
    });

    updateBlog = catchAsync(async (req: Request, res: Response) => {
        const blogId = Number(req.params.id);
        const { title, content, tag } = req.body;
        const imageFile = req.file;

        const updateData: Partial<{ title: string; content: string; tag: string; image: string }> = {
            tag,
            title,
            content,
        };
        if (imageFile) {
            updateData.image = imageFile.filename;
        }

        const updatedBlog = await this.blogService.updateBlog(blogId, updateData);

        res.status(200).json({
            status: 'success',
            data: { blog: updatedBlog },
        });
    });

    deleteBlog = catchAsync(async (req: Request, res: Response) => {
        const blogId = Number(req.params.id);
        await this.blogService.deleteBlog(blogId);
        res.status(200).json({
            status: 'success',
            message: 'Blog deleted (soft delete)',
        });
    });
}