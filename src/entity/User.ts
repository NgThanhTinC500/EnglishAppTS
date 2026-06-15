import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { VocabularySet } from "./VocabularySet";
import { Blog } from "./Blog";
import { Attempt } from "./Attempt";
import { ForumComment } from "./ForumComment";
import { ForumPost } from "./ForumPost";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

@Entity()
@Unique(["email"])
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true, default: "/uploads/image/avatar.webp" })
    photo: string;

    @Column({ select: false })
    password: string;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: "timestamp", nullable: true })
    passwordChangedAt: Date | null;

    // save random token
    @Column({ type: "text", nullable: true })
    passwordResetToken: string | null;

    // save token expiration time
    @Column({ type: "timestamp", nullable: true })
    passwordResetExpires: Date | null;

    @OneToMany(() => VocabularySet, (v) => v.user)
    vocabularySets: VocabularySet[];

    @OneToMany(() => Blog, (b) => b.author)
    blogs: Blog[];

    @OneToMany(() => Attempt, (a) => a.user)
    attempts: Attempt[];

    @OneToMany(() => ForumPost, (post) => post.user)
    forumPosts: ForumPost[];

    @OneToMany(() => ForumComment, (comment) => comment.user)
    forumComments: ForumComment[];
}
