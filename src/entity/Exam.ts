import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    RelationCount,
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

    @ManyToOne(() => Topic, (topic) => topic.exams, { onDelete: "CASCADE" })
    @JoinColumn({ name: "topicId" })
    topic: Topic;

    @Column()
    title: string;

    @Column({ type: "boolean", default: true })
    isActive: boolean;
    // đếm số câu hỏi theo đề
    @RelationCount((exam: Exam) => exam.examQuestions)
    questionCount: number;

    @OneToMany(() => ExamQuestion, (eq) => eq.exam)
    examQuestions: ExamQuestion[];

    @OneToMany(() => Attempt, (attempt) => attempt.exam)
    attempts: Attempt[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
