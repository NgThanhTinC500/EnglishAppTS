import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { ToeicExamSet } from "./ToeicExamSet";

@Entity("toeic_collections")
export class ToeicCollection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: "boolean", default: false })
    isPublished: boolean;

    @OneToMany(() => ToeicExamSet, (examSet) => examSet.collection)
    examSets: ToeicExamSet[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
