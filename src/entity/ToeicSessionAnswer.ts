import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import { ToeicExamSession } from "./ToeicExamSession";
import { ToeicQuestion } from "./ToeicQuestion";
import { ToeicQuestionOption } from "./ToeicQuestionOption";

@Entity("toeic_session_answers")
@Unique(["sessionId", "questionId"])
export class ToeicSessionAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @ManyToOne(() => ToeicExamSession, (session) => session.answers, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "sessionId" })
    session: ToeicExamSession;

    @Column()
    questionId: number;

    @ManyToOne(() => ToeicQuestion, (question) => question.sessionAnswers, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "questionId" })
    question: ToeicQuestion;

    @Column({ nullable: true })
    selectedOptionId: number | null;

    @ManyToOne(() => ToeicQuestionOption, {
        nullable: true,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "selectedOptionId" })
    selectedOption: ToeicQuestionOption | null;

    @Column({ type: "boolean", nullable: true })
    isCorrect: boolean | null;

    @Column({ type: "timestamptz", nullable: true })
    answeredAt: Date | null;

    @Column({ type: "int", default: 0 })
    timeSpentSeconds: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
