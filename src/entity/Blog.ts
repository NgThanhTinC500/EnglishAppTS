import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";

import { User } from "./User";

@Entity("blogs")
export class Blog {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    tag: string;

    @Column({ length: 80, default: "meo-lam-bai" })
    category: string;

    @Column({ length: 255, nullable: true, unique: true })
    slug?: string;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 500, nullable: true })
    excerpt?: string;

    @Column("text")
    content: string;

    @Column({ length: 500, nullable: true })
    image?: string;

    @Column({ length: 500, nullable: true })
    coverImage?: string;

    @Column({ default: 5 })
    readingTimeMinutes: number;

    @Column({ default: true })
    isPublished: boolean;

    @ManyToOne(() => User, user => user.blogs, { nullable: false })
    @JoinColumn({ name: "authorId" })
    author: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
