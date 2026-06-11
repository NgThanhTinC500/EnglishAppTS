import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ForumComment } from "../entity/ForumComment";
import { ForumPost } from "../entity/ForumPost";
import { ForumPostLike } from "../entity/ForumPostLike";
import { Notification, NotificationType } from "../entity/Notification";
import { AppError } from "../utils/appError";
import { emitToUser } from "../socket";

type PaginationInput = {
    page?: number;
    limit?: number;
};

type CreatePostInput = {
    title?: string;
    content?: string;
    tags?: unknown;
};

export class ForumService {
    private postRepository: Repository<ForumPost>;
    private commentRepository: Repository<ForumComment>;
    private likeRepository: Repository<ForumPostLike>;

    constructor() {
        this.postRepository = AppDataSource.getRepository(ForumPost);
        this.commentRepository = AppDataSource.getRepository(ForumComment);
        this.likeRepository = AppDataSource.getRepository(ForumPostLike);
    }

    private getPagination({ page = 1, limit = 10 }: PaginationInput) {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 10;

        return {
            page: safePage,
            limit: safeLimit,
            skip: (safePage - 1) * safeLimit,
        };
    }

    private normalizeTags(tags: unknown): string[] {
        if (tags === undefined || tags === null) return [];

        if (!Array.isArray(tags)) {
            throw new AppError("tags phải là mảng chuỗi", 400);
        }

        const normalizedTags = tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 10);

        return Array.from(new Set(normalizedTags));
    }

    private toPostResponse(post: ForumPost, likedByMe = false) {
        return {
            id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            tags: post.tags,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likedByMe,
            user: post.user
                ? {
                    id: post.user.id,
                    name: post.user.name,
                    photo: post.user.photo,
                }
                : null,
        };
    }

    private toCommentResponse(comment: ForumComment) {
        return {
            id: comment.id,
            postId: comment.postId,
            userId: comment.userId,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user
                ? {
                    id: comment.user.id,
                    name: comment.user.name,
                    photo: comment.user.photo,
                }
                : null,
        };
    }

    async createPost(userId: string, input: CreatePostInput) {
        const title = input.title?.trim();
        const content = input.content?.trim();

        if (!title) {
            throw new AppError("Tiêu đề bài viết không được để trống", 400);
        }

        if (!content) {
            throw new AppError("Nội dung bài viết không được để trống", 400);
        }

        const post = this.postRepository.create({
            userId,
            title,
            content,
            tags: this.normalizeTags(input.tags),
        });

        const savedPost = await this.postRepository.save(post);
        return this.getPostById(savedPost.id, userId);
    }

    async getPosts(input: PaginationInput, currentUserId?: string) {
        const { page, limit, skip } = this.getPagination(input);
        const [posts, total] = await this.postRepository.findAndCount({
            relations: { user: true },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
        });

        const likedPostIds = await this.getLikedPostIds(posts.map((post) => post.id), currentUserId);

        return {
            posts: posts.map((post) => this.toPostResponse(post, likedPostIds.has(post.id))),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPostById(postId: number, currentUserId?: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: { user: true },
        });

        if (!post) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        const likedByMe = currentUserId
            ? await this.likeRepository.exists({ where: { postId, userId: currentUserId } })
            : false;

        return this.toPostResponse(post, likedByMe);
    }

    async likePost(postId: number, userId: string) {
        const post = await this.postRepository.findOne({ where: { id: postId } });

        if (!post) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        const existingLike = await this.likeRepository.findOne({
            where: { postId, userId },
        });

        // Một user chỉ được tính 1 like cho 1 bài viết, tránh tăng likes_count nhiều lần.
        if (existingLike) {
            return this.getPostById(postId, userId);
        }

        await AppDataSource.transaction(async (manager: EntityManager) => {
            const insertResult = await manager
                .createQueryBuilder()
                .insert()
                .into(ForumPostLike)
                .values({ postId, userId })
                .orIgnore()
                .execute();

            if (insertResult.identifiers.length > 0) {
                await manager.increment(ForumPost, { id: postId }, "likesCount", 1);
            }
        });

        return this.getPostById(postId, userId);
    }

    async createComment(postId: number, userId: string, rawContent?: string) {
        const content = rawContent?.trim();

        if (!content) {
            throw new AppError("Nội dung bình luận không được để trống", 400);
        }

        const result = await AppDataSource.transaction(async (manager: EntityManager) => {
            const post = await manager.findOne(ForumPost, {
                where: { id: postId },
                relations: { user: true },
            });

            if (!post) {
                throw new AppError("Không tìm thấy bài viết", 404);
            }

            const comment = await manager.save(
                ForumComment,
                manager.create(ForumComment, { postId, userId, content })
            );

            await manager.increment(ForumPost, { id: postId }, "commentsCount", 1);

            const savedComment = await manager.findOne(ForumComment, {
                where: { id: comment.id },
                relations: { user: true },
            });

            if (!savedComment) {
                throw new AppError("Không thể tạo bình luận", 500);
            }

            if (post.userId === userId) {
                return { comment: savedComment, notifyUserId: null, payload: null };
            }

            const payload = {
                type: NotificationType.NEW_COMMENT,
                postId: post.id,
                postTitle: post.title,
                commenterName: savedComment.user?.name ?? "Người dùng",
                commentContent: savedComment.content,
            };

            // Lưu notification trước khi emit để user vẫn thấy thông báo khi offline.
            await manager.save(
                Notification,
                manager.create(Notification, {
                    userId: post.userId,
                    type: NotificationType.NEW_COMMENT,
                    payload,
                })
            );

            return { comment: savedComment, notifyUserId: post.userId, payload };
        });

        if (result.notifyUserId && result.payload) {
            emitToUser(result.notifyUserId, "new_notification", result.payload);
        }

        return this.toCommentResponse(result.comment);
    }

    async getComments(postId: number, input: PaginationInput) {
        const postExists = await this.postRepository.exists({ where: { id: postId } });

        if (!postExists) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        const { page, limit, skip } = this.getPagination(input);
        const [comments, total] = await this.commentRepository.findAndCount({
            where: { postId },
            relations: { user: true },
            order: { createdAt: "ASC" },
            skip,
            take: limit,
        });

        return {
            comments: comments.map((comment) => this.toCommentResponse(comment)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private async getLikedPostIds(postIds: number[], currentUserId?: string): Promise<Set<number>> {
        if (!currentUserId || postIds.length === 0) {
            return new Set();
        }

        const likes = await this.likeRepository
            .createQueryBuilder("like")
            .select("like.postId", "postId")
            .where("like.userId = :userId", { userId: currentUserId })
            .andWhere("like.postId IN (:...postIds)", { postIds })
            .getRawMany<{ postId: number }>();

        return new Set(likes.map((like) => Number(like.postId)));
    }
}
