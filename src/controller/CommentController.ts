import { Request, Response } from "express";
import { CommentService } from "../service/commentService";
import catchAsync from "../utils/catchAsync";

export class CommentController {
    private commentService: CommentService;

    constructor() {
        this.commentService = new CommentService();
    }

    createComment = catchAsync(async (req: Request, res: Response) => {
        const lectureId = Number(req.params.lectureId);
        const parentCommentId = req.body.parentCommentId
            ? Number(req.body.parentCommentId)
            : undefined;
        const content = req.body.content?.trim();
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        if (Number.isNaN(lectureId)) {
            return res.status(400).json({
                success: false,
                message: "lectureId không hợp lệ",
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Nội dung comment không được để trống",
            });
        }

        if (
            parentCommentId !== undefined &&
            Number.isNaN(parentCommentId)
        ) {
            return res.status(400).json({
                success: false,
                message: "parentCommentId không hợp lệ",
            });
        }

        const comment = await this.commentService.createComment(
            lectureId,
            userId,
            content,
            parentCommentId
        );

        res.status(201).json({
            success: true,
            data: comment,
        });
    });


    getCommentsByLectureId = catchAsync(async (req: Request, res: Response) => {
        const lectureId = Number(req.params.lectureId);
        if (Number.isNaN(lectureId)) {
            return res.status(400).json({
                success: false,
                message: "lectureId không hợp lệ",
            });
        }
        const comments = await this.commentService.getCommentsByLectureId(lectureId, req.user?.id);
        res.status(200).json({
            success: true,
            data: comments,
        });
    })

    updateComment = catchAsync(async (req: Request, res: Response) => {
        const commentId = Number(req.params.commentId);
        const content = req.body.content?.trim();
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Ban chua dang nhap",
            });
        }

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "commentId khong hop le",
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Noi dung binh luan khong duoc de trong",
            });
        }

        if (content.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Noi dung binh luan khong duoc vuot qua 255 ky tu",
            });
        }

        const comment = await this.commentService.updateComment(
            commentId,
            userId,
            content
        );

        res.status(200).json({
            success: true,
            data: comment,
        });
    })

    deleteComment = catchAsync(async (req: Request, res: Response) => {
        const commentId = Number(req.params.commentId);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Ban chua dang nhap",
            });
        }

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "commentId khong hop le",
            });
        }

        const deletedComment = await this.commentService.deleteComment(
            commentId,
            userId
        );

        res.status(200).json({
            success: true,
            data: deletedComment,
        });
    })

    toggleLike = catchAsync(async (req: Request, res: Response) => {
        const commentId = Number(req.params.commentId);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Ban chua dang nhap",
            });
        }

        if (Number.isNaN(commentId)) {
            return res.status(400).json({
                success: false,
                message: "commentId khong hop le",
            });
        }

        const comment = await this.commentService.toggleLike(commentId, userId);
        res.status(200).json({
            success: true,
            data: comment,
        });
    })
}
