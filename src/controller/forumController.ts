import { Request, Response } from "express";
import { ForumService } from "../service/forumService";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/appError";

export class ForumController {
    private forumService: ForumService;

    constructor() {
        this.forumService = new ForumService();
    }

    private parseId(id: unknown, fieldName: string) {
        if (typeof id !== "string") {
            throw new AppError(`${fieldName} không hợp lệ`, 400);
        }

        const parsedId = Number(id);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            throw new AppError(`${fieldName} không hợp lệ`, 400);
        }

        return parsedId;
    }

    private getPagination(req: Request) {
        return {
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 10),
        };
    }

    private getAdminPostQuery(req: Request) {
        return {
            ...this.getPagination(req),
            search: typeof req.query.search === "string" ? req.query.search : undefined,
        };
    }

    createPost = catchAsync(async (req: Request, res: Response) => {
        const post = await this.forumService.createPost(req.user.id, req.body);

        res.status(201).json({
            status: "success",
            data: { post },
        });
    });

    updatePost = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const post = await this.forumService.updatePost(
            postId,
            req.user.id,
            req.body
        );

        res.status(200).json({
            status: "success",
            data: { post },
        });
    });

    deletePost = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const result = await this.forumService.deletePost(postId, req.user.id);

        res.status(200).json({
            status: "success",
            data: result,
        });
    });

    getPosts = catchAsync(async (req: Request, res: Response) => {
        const result = await this.forumService.getPosts(this.getPagination(req), req.user?.id);

        res.status(200).json({
            status: "success",
            results: result.posts.length,
            pagination: result.pagination,
            data: { posts: result.posts },
        });
    });

    getPostById = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const post = await this.forumService.getPostById(postId, req.user?.id);

        res.status(200).json({
            status: "success",
            data: { post },
        });
    });

    likePost = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const post = await this.forumService.likePost(postId, req.user.id);

        res.status(200).json({
            status: "success",
            data: { post },
        });
    });

    createComment = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const comment = await this.forumService.createComment(postId, req.user.id, req.body.content);

        res.status(201).json({
            status: "success",
            data: { comment },
        });
    });

    updateComment = catchAsync(async (req: Request, res: Response) => {
        const commentId = this.parseId(req.params.commentId, "commentId");
        const comment = await this.forumService.updateComment(
            commentId,
            req.user.id,
            req.body.content
        );

        res.status(200).json({
            status: "success",
            data: { comment },
        });
    });

    deleteComment = catchAsync(async (req: Request, res: Response) => {
        const commentId = this.parseId(req.params.commentId, "commentId");
        const result = await this.forumService.deleteComment(
            commentId,
            req.user.id
        );

        res.status(200).json({
            status: "success",
            data: result,
        });
    });

    getComments = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const result = await this.forumService.getComments(postId, this.getPagination(req));

        res.status(200).json({
            status: "success",
            results: result.comments.length,
            pagination: result.pagination,
            data: { comments: result.comments },
        });
    });

    getAdminPosts = catchAsync(async (req: Request, res: Response) => {
        const result = await this.forumService.getAdminPosts(
            this.getAdminPostQuery(req)
        );

        res.status(200).json({
            status: "success",
            results: result.posts.length,
            pagination: result.pagination,
            stats: result.stats,
            data: { posts: result.posts },
        });
    });

    setPostVisibility = catchAsync(async (req: Request, res: Response) => {
        const postId = this.parseId(req.params.id, "postId");
        const post = await this.forumService.setPostVisibility(
            postId,
            req.body.isVisible
        );

        res.status(200).json({
            status: "success",
            data: { post },
        });
    });
}
