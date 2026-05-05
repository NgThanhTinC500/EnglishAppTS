import { IsOptional } from 'class-validator';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { Lesson } from './Lesson';

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @IsOptional()
    @Column()
    thumbnailUrl: string;

    @OneToMany(() => Lesson, (lesson) => lesson.course)
    lessons: Lesson[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
