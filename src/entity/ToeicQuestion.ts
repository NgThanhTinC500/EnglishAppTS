import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import { ToeicQuestionGroup } from "./ToeicQuestionGroup";
import { ToeicQuestionOption } from "./ToeicQuestionOption";
import { ToeicSessionAnswer } from "./ToeicSessionAnswer";

@Entity("toeic_questions")
@Unique(["questionGroupId", "questionNumber"])
export class ToeicQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionGroupId: number;

    @ManyToOne(() => ToeicQuestionGroup, (group) => group.questions, {
        onDelete: "CASCADE",
    })

    @JoinColumn({ name: "questionGroupId" })
    questionGroup: ToeicQuestionGroup;

    @Column({ type: "int" })
    questionNumber: number;

    @Column({ type: "text", nullable: true })
    content: string | null;

    @Column({ type: "text", nullable: true })
    explanation: string | null;

    @Column({ nullable: true })
    correctOptionId: number | null;

    @ManyToOne(() => ToeicQuestionOption, {
        nullable: true,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "correctOptionId" })
    correctOption: ToeicQuestionOption | null;

    @OneToMany(() => ToeicQuestionOption, (option) => option.question)
    options: ToeicQuestionOption[];

    @OneToMany(() => ToeicSessionAnswer, (answer) => answer.question)
    sessionAnswers: ToeicSessionAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
