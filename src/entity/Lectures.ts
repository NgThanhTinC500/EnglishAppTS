import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';

import { Lesson } from './Lesson';
@Entity('lectures')
export class Lecture {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lessonId: number;

    @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lessonId' })
    lesson: Lesson;

    @Column()
    title: string;

    @Column()
    videoUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}