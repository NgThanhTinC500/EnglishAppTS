import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { ForumPost } from "./ForumPost";
import { User } from "./User";

// The app already has a lecture comments table, so forum comments use a
// dedicated table while the public REST path remains /api/forum/posts/:id/comments.
@Entity("forum_comments")
export class ForumComment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "post_id" })
    @Index()
    postId!: number;

    @ManyToOne(() => ForumPost, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post!: ForumPost;

    @Column({ name: "parent_comment_id", nullable: true })
    @Index()
    parentCommentId!: number | null;

    @ManyToOne(() => ForumComment, (comment) => comment.replies, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "parent_comment_id" })
    parentComment!: ForumComment | null;

    @OneToMany(() => ForumComment, (comment) => comment.parentComment)
    replies!: ForumComment[];

    @Column({ name: "user_id", type: "uuid" })
    @Index()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "text" })
    content!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
