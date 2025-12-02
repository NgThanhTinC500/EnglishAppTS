import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { UserExamAttempt } from "./UserExamAttempt";
import { Question } from "./Question";
import { Answer } from "./Answer";

@Entity("user_answers")
export class UserAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    attemptId: number;

    @Column({ type: "int" })
    questionId: number;

    @Column({ type: "int", nullable: true })
    answerId: number; // ID của đáp án user chọn

    @Column({ type: "boolean", default: false })
    isCorrect: boolean;

    @Column({ type: "int", nullable: true })
    timeSpent: number; // Thời gian làm câu này (giây)

    // nhieu user thuộc về userExamAttempt
    @ManyToOne(() => UserExamAttempt, (attempt) => attempt.userAnswers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "attemptId" })
    attempt: UserExamAttempt;

    // Bảng UserAnswer sẽ nối với bảng Question, 
    // ở bảng question sẽ có thuộc tính (attribute) tên userAnswer
    // đó là sự móc nối của bên kia
    @ManyToOne(() => Question, (question) => question.userAnswers)
    @JoinColumn({ name: "questionId" })
    // khi truy vấn, sẽ đổ dữ liệu vào biến question
    // ví dụ như là khi relation
    question: Question;

    @ManyToOne(() => Answer, { nullable: true })
    @JoinColumn({ name: "answerId" })
    selectedAnswer: Answer;

    @CreateDateColumn()
    createdAt: Date;
}