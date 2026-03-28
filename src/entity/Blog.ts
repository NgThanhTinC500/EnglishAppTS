import {
    IsNotEmpty,
    IsString,
    MaxLength,
    IsOptional,
    IsBoolean,
} from "class-validator";

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

    // ===== Tag =====
    @Column({ length: 255 })
    @IsNotEmpty({ message: "Tag is required" })
    @IsString()
    @MaxLength(255)
    tag: string;

    // ===== Title =====
    @Column({ length: 255 })
    @IsNotEmpty({ message: "Title is required" })
    @IsString()
    @MaxLength(255)
    title: string;

    // ===== Content =====
    @Column("text")
    @IsNotEmpty({ message: "Content is required" })
    @IsString()
    content: string;

    // ===== Image =====
    @Column({ length: 500, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    image?: string;

    // ===== Publish status =====
    @Column({ default: true })
    @IsBoolean()
    isPublished: boolean;

    // ===== Author relation =====
    @ManyToOne(() => User, user => user.blogs, { nullable: false })
    @JoinColumn({ name: "authorId" })
    author: User;

    // ===== Timestamps =====
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}