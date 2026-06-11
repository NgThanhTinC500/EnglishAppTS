import {
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    Column,
} from "typeorm";
import { ForumPost } from "./ForumPost";
import { User } from "./User";

@Entity("forum_post_likes")
@Unique(["postId", "userId"])
export class ForumPostLike {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "post_id" })
    @Index()
    postId!: number;

    @ManyToOne(() => ForumPost, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post!: ForumPost;

    @Column({ name: "user_id", type: "uuid" })
    @Index()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
