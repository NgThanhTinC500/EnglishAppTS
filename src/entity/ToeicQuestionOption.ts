import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import { ToeicQuestion } from "./ToeicQuestion";

export enum ToeicOptionLabel {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
}

@Entity("toeic_question_options")
@Unique(["questionId", "optionLabel"])
export class ToeicQuestionOption {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionId: number;

    @ManyToOne(() => ToeicQuestion, (question) => question.options, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "questionId" })
    question: ToeicQuestion;

    @Column({
        type: "enum",
        enum: ToeicOptionLabel,
    })
    optionLabel: ToeicOptionLabel;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "boolean", default: false })
    isCorrect: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
