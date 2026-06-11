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
import { ToeicQuestionGroup } from "./ToeicQuestionGroup";

@Entity("toeic_question_group_images")
@Unique(["questionGroupId", "imageOrder"])
export class ToeicQuestionGroupImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionGroupId: number;

    @ManyToOne(() => ToeicQuestionGroup, (group) => group.images, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "questionGroupId" })
    questionGroup: ToeicQuestionGroup;

    @Column({ type: "int" })
    imageOrder: number;

    @Column({ type: "text" })
    imageUrl: string;

    @Column({ type: "text", nullable: true })
    translationVi: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
