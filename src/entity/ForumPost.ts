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
import { User } from "./User";
import { ForumComment } from "./ForumComment";

@Entity("posts")
export class ForumPost {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    @Index()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @OneToMany(() => ForumComment, (comment) => comment.post)
    comments!: ForumComment[];

    @Column({ length: 255 })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ type: "text", array: true, default: "{}" })
    tags!: string[];

    @Column({ name: "likes_count", type: "int", default: 0 })
    likesCount!: number;

    @Column({ name: "comments_count", type: "int", default: 0 })
    commentsCount!: number;

    @Column({ name: "is_visible", type: "boolean", default: true })
    isVisible!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
