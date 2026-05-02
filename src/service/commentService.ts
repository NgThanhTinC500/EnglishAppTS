import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";

export class CommentService {
    private commentRepository = AppDataSource.getRepository(Comment);

    async createComment(
        lectureId: number,
        userId: string,
        content: string,
        parentCommentId?: number
    ): Promise<Comment> {
        if (parentCommentId !== undefined) {
            const parent = await this.commentRepository.findOne({
                where: {
                    id: parentCommentId,
                    lectureId,
                },
            });

            if (!parent) {
                throw new Error("Không tìm thấy comment cha");
            }

            if (parent.parentCommentId) {
                throw new Error("Chỉ hỗ trợ reply 2 cấp");
            }
        }

        const comment = this.commentRepository.create({
            content: content.trim(),
            userId,
            lectureId,
            parentCommentId: parentCommentId ?? null,
        });

        return await this.commentRepository.save(comment);
    }

    async getCommentsByLectureId(lectureId: number): Promise<Comment[]> {
        return await this.commentRepository.find({
            where: { lectureId },
            // relations: ["user", "replies", "replies.user"],
            order: {
                createdAt: "ASC",
            },
        });
    }
}
