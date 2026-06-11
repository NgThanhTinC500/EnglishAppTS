import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { QuestionOption } from "./QuestionOption";
import { ExamQuestion } from "./ExamQuestion";

export enum QuestionType {
    SINGLE_CHOICE = 'single_choice',
    DICTATION = 'dictation',
}

export enum QuestionCategory {
    GRAMMAR = 'grammar',
    LISTENING = 'listening',
}

@Entity("questions")
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: QuestionCategory, default: QuestionCategory.GRAMMAR })
    category: QuestionCategory;

    @Column({ type: 'enum', enum: QuestionType, default: QuestionType.SINGLE_CHOICE })
    type: QuestionType;

    @Column({ type: "text", nullable: true })
    content: string | null;  // listening có thể không có text

    @Column({ type: "text", nullable: true })
    explanation: string | null;  // không phải câu nào cũng có giải thích

    // ===== LISTENING =====
    @Column({ type: "varchar", length: 255, nullable: true })
    audioUrl: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    audioFileName: string | null;

    @Column({ type: "integer", nullable: true })
    audioDuration: number | null;

    @Column({ type: "text", nullable: true })
    transcript: string | null;

    @Column({ type: "boolean", default: false })
    showTranscript: boolean;

    @Column({ type: "text", nullable: true })
    dictationAnswer: string | null;

    // ===== RELATIONS =====
    @OneToMany(() => QuestionOption, option => option.question, { cascade: true })
    options: QuestionOption[];

    @OneToMany(() => ExamQuestion, eq => eq.question)
    examQuestions: ExamQuestion[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
