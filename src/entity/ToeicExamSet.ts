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
import { ToeicCollection } from "./ToeicCollection";
import { ToeicExamPart } from "./ToeicExamPart";
import { ToeicExamSession } from "./ToeicExamSession";

@Entity("toeic_exam_sets")
export class ToeicExamSet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    collectionId: number;

    @ManyToOne(() => ToeicCollection, (collection) => collection.examSets, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "collectionId" })
    collection: ToeicCollection;

    @Column({ length: 255 })
    title: string;

    @Column({ type: "boolean", default: false })
    isPublished: boolean;

    @OneToMany(() => ToeicExamPart, (part) => part.examSet)
    parts: ToeicExamPart[];

    @OneToMany(() => ToeicExamSession, (session) => session.examSet)
    sessions: ToeicExamSession[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
