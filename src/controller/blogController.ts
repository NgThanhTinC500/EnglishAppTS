import { Request, Response } from "express";
import { BlogService } from "../service/blogService";
import catchAsync from "../utils/catchAsync";

export class BlogController {
    constructor(private blogService: BlogService) { }

    getAllBlogs = catchAsync(async (_req: Request, res: Response) => {
        const blogs = await this.blogService.getAllBlogs();
        res.status(200).json({
            status: "success",
            results: blogs.length,
            data: { blogs },
        });
    });

    getAllBlogsForAdmin = catchAsync(async (_req: Request, res: Response) => {
        const blogs = await this.blogService.getAllBlogs(true);
        res.status(200).json({
            status: "success",
            results: blogs.length,
            data: { blogs },
        });
    });

    getBlogById = catchAsync(async (req: Request, res: Response) => {
        const blogId = Number(req.params.id);
        const blog = await this.blogService.getBlogById(blogId);
        res.status(200).json({
            status: "success",
            data: { blog },
        });
    });

    createBlog = catchAsync(async (req: Request, res: Response) => {
        const imageFile = req.file;
        const newBlog = await this.blogService.createBlog({
            ...this.pickBlogPayload(req.body, true),
            image: imageFile ? imageFile.filename : req.body.image,
            coverImage: req.body.coverImage || (imageFile ? imageFile.filename : req.body.image),
            author: req.user,
        });

        res.status(201).json({
            status: "success",
            data: { blog: newBlog },
        });
    });

    updateBlog = catchAsync(async (req: Request, res: Response) => {
        const blogId = Number(req.params.id);
        const imageFile = req.file;
        const updateData = {
            ...this.pickBlogPayload(req.body, false),
            image: imageFile ? imageFile.filename : req.body.image,
            coverImage: req.body.coverImage || (imageFile ? imageFile.filename : req.body.image),
        };

        const updatedBlog = await this.blogService.updateBlog(blogId, updateData);

        res.status(200).json({
            status: "success",
            data: { blog: updatedBlog },
        });
    });

    deleteBlog = catchAsync(async (req: Request, res: Response) => {
        const blogId = Number(req.params.id);
        await this.blogService.deleteBlog(blogId);
        res.status(200).json({
            status: "success",
            message: "Blog deleted",
        });
    });

    private pickBlogPayload(body: Record<string, unknown>, isCreate: boolean) {
        const tag = typeof body.tag === "string"
            ? body.tag
            : typeof body.category === "string"
                ? body.category
                : undefined;
        const category = typeof body.category === "string" ? body.category : undefined;
        const slug = typeof body.slug === "string" ? body.slug : undefined;
        const title = typeof body.title === "string" ? body.title : undefined;
        const excerpt = typeof body.excerpt === "string" ? body.excerpt : undefined;
        const content = typeof body.content === "string" ? body.content : undefined;
        const readingTimeMinutes = Number(body.readingTimeMinutes ?? 5);

        const payload: Record<string, unknown> = {
            tag,
            category,
            slug,
            title,
            excerpt,
            content,
            readingTimeMinutes,
        };

        if (body.isPublished !== undefined) {
            payload.isPublished =
                typeof body.isPublished === "boolean"
                    ? body.isPublished
                    : body.isPublished === "true";
        } else if (isCreate) {
            payload.isPublished = true;
        }

        return payload;
    }
}
