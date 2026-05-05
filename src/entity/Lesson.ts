import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Course } from './Courses';
import { Lecture } from './Lectures';

@Entity('lessons')
export class Lesson {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    courseId: number;

    @ManyToOne(() => Course, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'courseId' })
    course: Course;

    @Column()
    title: string;

    @OneToMany(() => Lecture, (lecture) => lecture.lesson)
    lectures: Lecture[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
