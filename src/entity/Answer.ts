import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
// import { Exam } from "./Exam";
import { Question } from "./Question";
@Entity("answers")

export class Answer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsInt()
    questionId: number;

    @Column()
    @IsNotEmpty()
    @IsString()
    answerText: string;

    // type : kieu du lieu trong DB
    // còn kiểu dữ liệu phía dưới là kiểu dữ liệu trong TS
    @Column({ type: 'boolean', default: false })
    @IsBoolean()
    isCorrect: boolean;

    @Column({ type: 'text', nullable: true })
    @IsOptional()
    explanation: string;

    @Column({ type: 'char', length: 1 })
    option: string;

    // nhieu dap an thuộc ve 1 câu hỏi
    @ManyToOne(() => Question, question => question.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "questionId" }) // khoa ngoai
    question: Question;

}   