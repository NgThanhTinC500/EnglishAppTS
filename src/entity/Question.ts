import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUrl, MaxLength, Min } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm"
import { QuestionOption } from "./QuestionOption";
import { ExamQuestion } from "./ExamQuestion";
export enum QuestionType {
    SINGLE_CHOICE = 'single_choice',
}
@Entity("questions")
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: QuestionType, default: QuestionType.SINGLE_CHOICE })
    type: QuestionType;

    @Column({ type: "text" })
    @IsNotEmpty({ message: "Question text is required" })
    content: string;

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
    // với mỗi option, field question của nó là chiều ngược lại của mqh này
    @OneToMany(() => QuestionOption, option => option.question, { cascade: true })
    options: QuestionOption[];

    // @OneToMany(() => QuestionTopic, qt => qt.question)
    // questionTopics: QuestionTopic[];

    @OneToMany(() => ExamQuestion, eq => eq.question)
    examQuestions: ExamQuestion[];

    // @ManyToOne(() => Exam, exam => exam.questions, {
    //     onDelete: "CASCADE"
    // })

    // @JoinColumn({ name: "examId" })
    // exam: Exam;

    // @OneToMany(() => Answer, answer => answer.question, {
    //     cascade: true
    // })
    // answers: Answer[];

    // @OneToMany(() => UserAnswer, ua => ua.question)
    // userAnswers: UserAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}