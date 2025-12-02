import { IsNotEmpty, MinLength } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, Unique, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { Exam } from "./Exam";
import { Question } from "./Question";
@Entity("answers")

export class Answer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    questionId: number;

    @Column({ type: 'text' })
    answerText: string;

    // type : kieu du lieu trong DB
    // còn kiểu dữ liệu phía dưới là kiểu dữ liệu trong TS
    @Column({ type: 'boolean', default: false })
    isCorrect: boolean;

    @Column({ type: 'text', nullable: true })
    explanation: string;

    @Column({ type: 'char', length: 1 })
    option: String;

    // nhieu dap an thuộc ve 1 câu hỏi
    @ManyToOne(() => Question, question => question.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "questionId" }) // khoa ngoai
    question: Question;


}   