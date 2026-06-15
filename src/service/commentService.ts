import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { CommentLike } from "../entity/CommentLike";
import { AppError } from "../utils/appError";

export class CommentService {
    private commentRepository = AppDataSource.getRepository(Comment);
    private likeRepository = AppDataSource.getRepository(CommentLike);

    private toCommentResponse(comment: Comment, currentUserId?: string) {
        const likes = comment.likes ?? [];

        return {
            id: comment.id,
            content: comment.content,
            userId: comment.userId,
            lectureId: comment.lectureId,
            parentCommentId: comment.parentCommentId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user
                ? {
                    id: comment.user.id,
                    name: comment.user.name,
                    email: comment.user.email,
                    photo: comment.user.photo,
                }
                : null,
            likeCount: likes.length,
            likedByMe: currentUserId
                ? likes.some((like) => like.userId === currentUserId)
                : false,
        };
    }

    async createComment(
        lectureId: number,
        userId: string,
        content: string,
        parentCommentId?: number
    ) {
        if (parentCommentId !== undefined) {
            const parent = await this.commentRepository.findOne({
                where: {
                    id: parentCommentId,
                    lectureId,
                },
            });

            if (!parent) {
                throw new AppError("Khong tim thay comment cha", 404);
            }

            if (parent.parentCommentId) {
                throw new AppError("Chi ho tro reply 2 cap", 400);
            }
        }

        const comment = this.commentRepository.create({
            content: content.trim(),
            userId,
            lectureId,
            parentCommentId: parentCommentId ?? null,
        });

        const savedComment = await this.commentRepository.save(comment);
        return this.getCommentById(savedComment.id, userId);
    }

    async getCommentById(commentId: number, currentUserId?: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: { user: true, likes: true },
        });

        if (!comment) {
            throw new AppError("Comment not found", 404);
        }

        return this.toCommentResponse(comment, currentUserId);
    }

    async getCommentsByLectureId(lectureId: number, currentUserId?: string) {
        const comments = await this.commentRepository.find({
            where: { lectureId },
            relations: { user: true, likes: true },
            order: {
                createdAt: "ASC",
            },
        });

        return comments.map((comment) => this.toCommentResponse(comment, currentUserId));
    }

    async updateComment(commentId: number, userId: string, content: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new AppError("Khong tim thay binh luan", 404);
        }

        if (comment.userId !== userId) {
            throw new AppError("Ban khong co quyen sua binh luan nay", 403);
        }

        comment.content = content.trim();
        await this.commentRepository.save(comment);

        return this.getCommentById(commentId, userId);
    }

    async deleteComment(commentId: number, userId: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new AppError("Khong tim thay binh luan", 404);
        }

        if (comment.userId !== userId) {
            throw new AppError("Ban khong co quyen xoa binh luan nay", 403);
        }

        await this.commentRepository.remove(comment);

        return {
            id: commentId,
            lectureId: comment.lectureId,
        };
    }

    async toggleLike(commentId: number, userId: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new AppError("Comment not found", 404);
        }

        const existingLike = await this.likeRepository.findOne({
            where: { commentId, userId },
        });

        if (existingLike) {
            await this.likeRepository.delete(existingLike.id);
        } else {
            await this.likeRepository.save(
                this.likeRepository.create({ commentId, userId })
            );
        }

        return this.getCommentById(commentId, userId);
    }
}
