import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUrl, MaxLength, Min } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm"
import { Exam } from "./Exam";
import { Answer } from "./Answer";
import { UserAnswer } from "./UserAnswer";
@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    @IsInt({ message: "examId must be an integer" })
    @Min(1, { message: "examId must be greater than 0" })
    examId: number;

    @Column({ type: "text" })
    @IsNotEmpty({ message: "Question text is required" })
    questionText: string;

    @Column({ type: "text" })
    @IsOptional()
    explanation: string;

    // ===== LISTENING =====

    @Column({ type: "varchar", length: 255, nullable: true })
    @IsOptional()
    @IsUrl({}, { message: "audioUrl must be a valid URL" })
    audioUrl: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    @IsOptional()
    @MaxLength(255, { message: "audioFileName too long" })
    audioFileName: string;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @IsInt({ message: "audioDuration must be integer" })
    @Min(1, { message: "audioDuration must be greater than 0" })
    audioDuration: number;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    transcript: string;

    @Column({ type: "boolean", default: false })
    @IsBoolean()
    showTranscript: boolean;

    // ===== RELATIONS =====

    @ManyToOne(() => Exam, exam => exam.questions, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "examId" })
    exam: Exam;

    @OneToMany(() => Answer, answer => answer.question, {
        cascade: true
    })
    answers: Answer[];

    @OneToMany(() => UserAnswer, ua => ua.question)
    userAnswers: UserAnswer[];

    @CreateDateColumn()
    createdAt: Date;
}