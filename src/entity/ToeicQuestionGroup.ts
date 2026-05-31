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
import { ToeicExamPart } from "./ToeicExamPart";
import { ToeicQuestionGroupImage } from "./ToeicQuestionGroupImage";
import { ToeicQuestion } from "./ToeicQuestion";

@Entity("toeic_question_groups")
@Unique(["examPartId", "groupOrder"])
export class ToeicQuestionGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    examPartId: number;

    @ManyToOne(() => ToeicExamPart, (part) => part.questionGroups, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "examPartId" })
    examPart: ToeicExamPart;

    @Column({ type: "int" })
    groupOrder: number;

    @Column({ type: "text", nullable: true })
    audioUrl: string | null;

    @Column({ type: "int", nullable: true })
    audioDurationSeconds: number | null;

    @Column({ type: "text", nullable: true })
    transcriptEn: string | null;

    @Column({ type: "text", nullable: true })
    transcriptVi: string | null;

    @OneToMany(() => ToeicQuestionGroupImage, (image) => image.questionGroup)
    images: ToeicQuestionGroupImage[];

    @OneToMany(() => ToeicQuestion, (question) => question.questionGroup)
    questions: ToeicQuestion[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
