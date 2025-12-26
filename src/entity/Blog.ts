import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("blogs")
export class Blog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    tag: string;

    @Column({ length: 255 })
    title: string;

    @Column("text")
    content: string;

    @Column({ length: 500, nullable: true })
    image: string;

    @Column({ default: true })
    isPublished: boolean;

    @ManyToOne(() => User, user => user.blogs)
    @JoinColumn({ name: "authorId" })
    author: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}