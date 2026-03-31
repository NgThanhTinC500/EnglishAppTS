import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';

import { Section } from './Sections';
@Entity('lectures')
export class Lecture {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sectionId: number;

    @ManyToOne(() => Section, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sectionId' })
    section: Section;

    @Column()
    title: string;

    @Column()
    videoUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}