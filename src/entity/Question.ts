import { IsNotEmpty, MinLength } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, Unique, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm"
import { Exam } from "./Exam";
import { Answer } from "./Answer";
import { UserAnswer } from "./UserAnswer";
@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    examId: number;

    @Column({ type: 'text' })
    questionText: string;

    // type : kieu du lieu trong DB
    // còn kiểu dữ liệu phía dưới là kiểu dữ liệu trong TS
    @Column({ type: 'int' })
    orderNumber: number;

    @Column({ type: 'text' })
    explanation: string;

    // nhieu cau hoi thuoc ve 1 bai thi
    // onDelete:Cascade => khi exam bi xoa thi question cung bi xoa
    @ManyToOne(() => Exam, exam => exam.questions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "examId" }) // luôn được đặt phía @ManyToOne
    exam: Exam; // trong bảng question lưu examId

    // 1 cau hoi  gom nhieu dap an
    // khi luu question thì lưu thêm answer
    @OneToMany(() => Answer, answer => answer.question, { cascade: true })
    answers: Answer[];

    // để thống kê, xem câu hỏi nào nhiều thi sinh trả lời đúng or sai
    @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.question)
    userAnswers: UserAnswer[];

    @CreateDateColumn()
    createdAt: Date;
}   