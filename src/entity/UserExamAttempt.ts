import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { Exam } from "./Exam";
import { UserAnswer } from "./UserAnswer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";


export enum AttemptStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
}
@Entity("user_exam_attempts")
export class UserExamAttempt {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    @IsInt({ message: "userId must be an integer" })
    @Min(1)
    userId: number;

    @Column({ type: "int" })
    @IsInt()
    @Min(1)
    examId: number;

    @Column({ type: "timestamp", nullable: true })
    @IsOptional()
    startedAt: Date;

    @Column({ type: "timestamp", nullable: true })
    @IsOptional()
    completedAt: Date;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @Min(0)
    @Max(100)
    score: number;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @Min(0)
    correctAnswers: number;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @Min(1)
    totalQuestions: number;

    @Column({
        type: "enum",
        enum: AttemptStatus,
        default: AttemptStatus.IN_PROGRESS
    })
    @IsEnum(AttemptStatus)
    status: AttemptStatus;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @Min(0)
    timeSpent: number;

    // ===== RELATIONS =====

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @ManyToOne(() => Exam, exam => exam.attempts, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "examId" })
    exam: Exam;

    @OneToMany(() => UserAnswer, ua => ua.attempt, {
        cascade: true
    })
    userAnswers: UserAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}