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
import { ToeicExamSet } from "./ToeicExamSet";
import { ToeicQuestionGroup } from "./ToeicQuestionGroup";

@Entity("toeic_exam_parts")
@Unique(["examSetId", "partNumber"])
export class ToeicExamPart {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    examSetId: number;

    @ManyToOne(() => ToeicExamSet, (examSet) => examSet.parts, {
        onDelete: "CASCADE",
    })

    @JoinColumn({ name: "examSetId" })
    examSet: ToeicExamSet;

    @Column({ type: "smallint" })
    partNumber: number;

    @Column({ type: "int" })
    questionCount: number;

    @Column({ type: "int", nullable: true })
    durationSeconds: number | null;

    @OneToMany(() => ToeicQuestionGroup, (group) => group.examPart)
    questionGroups: ToeicQuestionGroup[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
