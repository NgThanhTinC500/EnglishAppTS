import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    Column,
} from "typeorm";
import { Comment } from "./Comment";
import { User } from "./User";

@Entity("comment_likes")
@Unique(["commentId", "userId"])
export class CommentLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    commentId: number;

    @ManyToOne(() => Comment, { onDelete: "CASCADE" })
    @JoinColumn({ name: "commentId" })
    comment: Comment;

    @Column("uuid")
    userId: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
