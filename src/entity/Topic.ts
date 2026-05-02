import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Exam } from './Exam';

export enum TopicType {
  GRAMMAR = "grammar",
  LISTENING = "listening",
}
@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: TopicType,
    default: TopicType.GRAMMAR
  })
  type: TopicType;
  
  @OneToMany(() => Exam, exam => exam.topic)
  exams: Exam[];

  totalQuestions?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
