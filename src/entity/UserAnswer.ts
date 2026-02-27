import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { UserExamAttempt } from "./UserExamAttempt";
import { Question } from "./Question";
import { Answer } from "./Answer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

@Entity("user_answers")
export class UserAnswer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    @IsInt({ message: "attemptId must be an integer" })
    @Min(1, { message: "attemptId must be greater than 0" })
    attemptId: number;

    @Column({ type: "int" })
    @IsInt({ message: "questionId must be an integer" })
    @Min(1, { message: "questionId must be greater than 0" })
    questionId: number;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @IsInt({ message: "answerId must be an integer" })
    @Min(1, { message: "answerId must be greater than 0" })
    answerId: number;

    @Column({ type: "boolean", default: false })
    @IsBoolean()
    isCorrect: boolean;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0, { message: "timeSpent cannot be negative" })
    timeSpent: number;

    // ===== RELATIONS =====

    @ManyToOne(
        () => UserExamAttempt,
        attempt => attempt.userAnswers,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "attemptId" })
    attempt: UserExamAttempt;

    @ManyToOne(
        () => Question,
        question => question.userAnswers
    )
    @JoinColumn({ name: "questionId" })
    question: Question;

    @ManyToOne(() => Answer, { nullable: true })
    @JoinColumn({ name: "answerId" })
    selectedAnswer: Answer;

    @CreateDateColumn()
    createdAt: Date;
}