import {
    IsNotEmpty,
    MinLength,
    IsInt,
    Min,
    IsBoolean,
    IsOptional
} from "class-validator";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { Question } from "./Question";
import { UserExamAttempt } from "./UserExamAttempt";
@Entity("exams")

@Entity("exams")
export class Exam {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty({ message: "Title is required" })
    @MinLength(3, { message: "Title is too short" })
    title: string;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    description: string;

    @Column({ type: "int" })
    @IsInt({ message: "totalQuestions must be integer" })
    @Min(1, { message: "totalQuestions must be > 0" })
    totalQuestions: number;

    @Column({ type: "int", default: 60 })
    @IsInt()
    @Min(1)
    duration: number;

    @Column({ type: "boolean", default: true })
    @IsBoolean()
    isActive: boolean;

    @OneToMany(() => Question, question => question.exam)
    questions: Question[];

    @OneToMany(() => UserExamAttempt, attempt => attempt.exam)
    attempts: UserExamAttempt[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}