// src/entities/attempt-answer.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Unique
} from 'typeorm';
import { Attempt } from './Attempt';
import { Question } from './Question';
import { QuestionOption } from './QuestionOption';

export enum AnswerResult {
  UNCHECKED = 'unchecked',
  CORRECT = 'correct',
  WRONG = 'wrong',
}

@Entity('attempt_answers')
@Unique(['attemptId', 'questionId'])
export class AttemptAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  attemptId: number;

  // nếu dùng mối quan hệ 2 chiều thì khai báo tham số
  @ManyToOne(() => Attempt, attempt => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column()
  questionId: number;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ nullable: true })
  selectedOptionId: number | null;

  @ManyToOne(() => QuestionOption, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'selectedOptionId' })
  selectedOption: QuestionOption | null;

  @Column({ type: 'enum', enum: AnswerResult, default: AnswerResult.UNCHECKED })
  result: AnswerResult;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @Column({ nullable: true })
  correctOptionId: number;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}