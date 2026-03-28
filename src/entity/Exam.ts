import {
    IsNotEmpty,
    MinLength,
    IsInt,
    Min,
    IsBoolean,
    IsOptional
} from "class-validator";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { ExamQuestion } from "./ExamQuestion";
import { Attempt } from "./Attempt";
import { Topic } from "./Topic";

@Entity("exams")
export class Exam {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    topicId: number;

    @ManyToOne(() => Topic, topic => topic.exams, { onDelete: "CASCADE" })
    @JoinColumn({ name: "topicId" })
    topic: Topic;

    @Column()
    @IsNotEmpty({ message: "Title is required" })
    @MinLength(3, { message: "Title is too short" })
    title: string;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    description: string;

    // @Column({ type: "int" })
    // @IsInt({ message: "totalQuestions must be integer" })
    // @Min(1, { message: "totalQuestions must be > 0" })
    // totalQuestions: number;

    @Column({ type: "int", default: 60 })
    @IsInt()
    @Min(1)
    duration: number | null;

    @Column({ type: "boolean", default: true })
    @IsBoolean()
    isActive: boolean;

    @OneToMany(() => ExamQuestion, eq => eq.exam)
    examQuestions: ExamQuestion[];

    @OneToMany(() => Attempt, attempt => attempt.exam)
    attempts: Attempt[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}