import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { ToeicExamSet } from "./ToeicExamSet";
import { ToeicQuestion } from "./ToeicQuestion";
import { ToeicSessionAnswer } from "./ToeicSessionAnswer";

export enum ToeicSessionStatus {
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    EXPIRED = "expired",
}

@Entity("toeic_exam_sessions")
export class ToeicExamSession {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    examSetId: number;

    @ManyToOne(() => ToeicExamSet, (examSet) => examSet.sessions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "examSetId" })
    examSet: ToeicExamSet;

    @Column({
        type: "enum",
        enum: ToeicSessionStatus,
        default: ToeicSessionStatus.IN_PROGRESS,
    })
    status: ToeicSessionStatus;

    @Column({ type: "smallint", nullable: true })
    currentPartNumber: number | null;

    @Column({ nullable: true })
    currentQuestionId: number | null;

    @ManyToOne(() => ToeicQuestion, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "currentQuestionId" })
    currentQuestion: ToeicQuestion | null;

    @Column({ type: "timestamptz", nullable: true })
    startedAt: Date | null;

    @Column({ type: "timestamptz", nullable: true })
    submittedAt: Date | null;

    @Column({ type: "int", nullable: true })
    remainingSeconds: number | null;

    @Column({ type: "int", default: 0 })
    listeningCorrectCount: number;

    @Column({ type: "int", default: 0 })
    readingCorrectCount: number;

    @Column({ type: "int", nullable: true })
    listeningScore: number | null;

    @Column({ type: "int", nullable: true })
    readingScore: number | null;

    @Column({ type: "int", nullable: true })
    totalScore: number | null;

    @OneToMany(() => ToeicSessionAnswer, (answer) => answer.session)
    answers: ToeicSessionAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
