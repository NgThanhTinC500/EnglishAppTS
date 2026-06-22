// src/entities/attempt.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { User } from './User';
import { Exam } from './Exam';
import { AttemptAnswer } from './AttemptAnswer';

export enum AttemptMode {
  PRACTICE = 'practice',
  EXAM = 'exam',
}

export enum AttemptPracticeMode {
  GRAMMAR = 'grammar',
  LISTENING_CHECK = 'listening_check',
  DICTATION = 'dictation',
}

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  EXPIRED = 'expired',
}

@Entity('attempts')
export class Attempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // cột userId trong attempt là FK, trỏ đến id user
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AttemptMode })
  mode: AttemptMode;

  @Column({
    type: 'enum',
    enum: AttemptPracticeMode,
    default: AttemptPracticeMode.GRAMMAR,
  })
  practiceMode: AttemptPracticeMode;

  @Column({ nullable: true })
  examId: number | null;

  @ManyToOne(() => Exam, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'examId' })
  exam: Exam | null;

  @Column({ type: 'enum', enum: AttemptStatus, default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  score: number;

  @OneToMany(() => AttemptAnswer, aa => aa.attempt)
  answers: AttemptAnswer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
