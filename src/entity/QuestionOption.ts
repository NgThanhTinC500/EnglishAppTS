  // src/entities/question-option.entity.ts
  import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn
  } from 'typeorm';
  import { Question } from './Question';

  @Entity('question_options')
  export class QuestionOption {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionId: number;

    @ManyToOne(() => Question, question => question.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @Column()
    label: string; // A, B, C, D

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    isCorrect: boolean;
  }