// src/entities/exam-question.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Exam } from './Exam';
import { Question } from './Question';

@Entity('exam_questions')
@Unique(['examId', 'questionId'])
export class ExamQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    examId: number;

    @Column()
    questionId: number;

    @Column({ type: 'int' })
    orderIndex: number;

    @ManyToOne(() => Exam, exam => exam.examQuestions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'examId' })
    exam: Exam;

    @ManyToOne(() => Question, question => question.examQuestions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: Question;
}