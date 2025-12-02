import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { Exam } from "./Exam";
import { UserAnswer } from "./UserAnswer";

@Entity("user_exam_attempts")
export class UserExamAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    userId: string;

    @Column({ type: "int" })
    examId: number;

    @Column({ type: "timestamp", nullable: true })
    startedAt: Date;

    @Column({ type: "timestamp", nullable: true })
    completedAt: Date;

    @Column({ type: "int", nullable: true })
    score: number; // Điểm số (0-100)

    @Column({ type: "int", nullable: true })
    correctAnswers: number; // Số câu đúng

    @Column({ type: "int", nullable: true })
    totalQuestions: number; // Tổng số câu

    @Column({ type: "varchar", length: 20, default: "in_progress" })
    status: string; // in_progress, completed, abandoned

    @Column({ type: "int", nullable: true })
    timeSpent: number; // Thời gian làm bài (giây)

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @ManyToOne(() => Exam, (exam) => exam.attempts, { onDelete: "CASCADE" })
    @JoinColumn({ name: "examId" })
    exam: Exam;

    @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.attempt, { cascade: true })
    userAnswers: UserAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}