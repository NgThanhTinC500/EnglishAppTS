import { Brackets, EntityManager, Repository } from "typeorm";
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

type AdminPostQueryInput = PaginationInput & {
    search?: string;
};

type CreatePostInput = {
    title?: string;
    content?: string;
};

type UpdatePostInput = CreatePostInput;

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

    private toPostResponse(post: ForumPost, likedByMe = false) {
        return {
            id: post.id,
            userId: post.userId,
            title: post.title,
            content: post.content,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            isVisible: post.isVisible,
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

    private validatePostLengths(title?: string, content?: string) {
        if (title && title.length > 255) {
            throw new AppError("Tiêu đề bài viết không được vượt quá 255 ký tự", 400);
        }

        if (content && content.length > 20000) {
            throw new AppError("Nội dung bài viết không được vượt quá 20000 ký tự", 400);
        }
    }

    private validateCommentLength(content?: string) {
        if (content && content.length > 2000) {
            throw new AppError("Nội dung bình luận không được vượt quá 2000 ký tự", 400);
        }
    }

    async createPost(userId: string, input: CreatePostInput) {
        const title = input.title?.trim();
        const content = input.content?.trim();
        this.validatePostLengths(title, content);

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
            tags: [],
        });

        const savedPost = await this.postRepository.save(post);
        return this.getPostById(savedPost.id, userId);
    }

    async updatePost(postId: number, userId: string, input: UpdatePostInput) {
        const title = input.title?.trim();
        const content = input.content?.trim();
        this.validatePostLengths(title, content);

        if (!title) {
            throw new AppError("Tiêu đề bài viết không được để trống", 400);
        }

        if (!content) {
            throw new AppError("Nội dung bài viết không được để trống", 400);
        }

        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: { user: true },
        });

        if (!post) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        if (post.userId !== userId) {
            throw new AppError("Bạn không có quyền sửa bài viết này", 403);
        }

        post.title = title;
        post.content = content;
        const savedPost = await this.postRepository.save(post);
        const likedByMe = await this.likeRepository.exists({
            where: { postId, userId },
        });
        return this.toPostResponse(savedPost, likedByMe);
    }

    async deletePost(postId: number, userId: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        if (post.userId !== userId) {
            throw new AppError("Bạn không có quyền xóa bài viết này", 403);
        }

        await this.postRepository.remove(post);
        return { id: postId };
    }

    async getPosts(input: PaginationInput, currentUserId?: string) {
        const { page, limit, skip } = this.getPagination(input);
        const [posts, total] = await this.postRepository.findAndCount({
            where: { isVisible: true },
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
            where: { id: postId, isVisible: true },
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
        const post = await this.postRepository.findOne({
            where: { id: postId, isVisible: true },
        });

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
        this.validateCommentLength(content);

        if (!content) {
            throw new AppError("Nội dung bình luận không được để trống", 400);
        }

        const result = await AppDataSource.transaction(async (manager: EntityManager) => {
            const post = await manager.findOne(ForumPost, {
                where: { id: postId, isVisible: true },
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

    async updateComment(commentId: number, userId: string, rawContent?: string) {
        const content = rawContent?.trim();
        this.validateCommentLength(content);

        if (!content) {
            throw new AppError("Nội dung bình luận không được để trống", 400);
        }

        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: { user: true },
        });

        if (!comment) {
            throw new AppError("Không tìm thấy bình luận", 404);
        }

        if (comment.userId !== userId) {
            throw new AppError("Bạn không có quyền sửa bình luận này", 403);
        }

        comment.content = content;
        const savedComment = await this.commentRepository.save(comment);
        return this.toCommentResponse(savedComment);
    }

    async deleteComment(commentId: number, userId: string) {
        return AppDataSource.transaction(async (manager: EntityManager) => {
            const comment = await manager.findOne(ForumComment, {
                where: { id: commentId },
            });

            if (!comment) {
                throw new AppError("Không tìm thấy bình luận", 404);
            }

            if (comment.userId !== userId) {
                throw new AppError("Bạn không có quyền xóa bình luận này", 403);
            }

            await manager.remove(ForumComment, comment);
            await manager
                .createQueryBuilder()
                .update(ForumPost)
                .set({
                    commentsCount: () => 'GREATEST("comments_count" - 1, 0)',
                })
                .where("id = :postId", { postId: comment.postId })
                .execute();

            return { id: commentId, postId: comment.postId };
        });
    }

    async getComments(postId: number, input: PaginationInput) {
        const postExists = await this.postRepository.exists({
            where: { id: postId, isVisible: true },
        });

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

    async getAdminPosts(input: AdminPostQueryInput) {
        const { page, limit, skip } = this.getPagination(input);
        const search = input.search?.trim().slice(0, 100) ?? "";
        const query = this.postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.user", "user");

        if (search) {
            query.andWhere(
                new Brackets((builder) => {
                    builder
                        .where("post.title ILIKE :search", {
                            search: `%${search}%`,
                        })
                        .orWhere("user.name ILIKE :search", {
                            search: `%${search}%`,
                        });
                })
            );
        }

        const [posts, total] = await query
            .clone()
            .orderBy("post.createdAt", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const stats = await query
            .clone()
            .select("COUNT(post.id)", "total")
            .addSelect(
                `COUNT(post.id) FILTER (WHERE post.isVisible = true)`,
                "visible"
            )
            .addSelect(
                `COUNT(post.id) FILTER (WHERE post.isVisible = false)`,
                "hidden"
            )
            .getRawOne<{ total: string; visible: string; hidden: string }>();

        return {
            posts: posts.map((post) => this.toPostResponse(post)),
            stats: {
                total: Number(stats?.total ?? 0),
                visible: Number(stats?.visible ?? 0),
                hidden: Number(stats?.hidden ?? 0),
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async setPostVisibility(postId: number, isVisible: unknown) {
        if (typeof isVisible !== "boolean") {
            throw new AppError("isVisible phải là kiểu boolean", 400);
        }

        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: { user: true },
        });

        if (!post) {
            throw new AppError("Không tìm thấy bài viết", 404);
        }

        post.isVisible = isVisible;
        const savedPost = await this.postRepository.save(post);
        return this.toPostResponse(savedPost);
    }
}
