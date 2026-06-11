import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { VocabularySet } from "./VocabularySet";
import { VocabularyPracticeAnswer } from "./VocabularyPracticeAnswer";
import { VocabularyPracticeMode } from "./VocabularyPracticeEnums";

@Entity("vocabulary_practice_sessions")
export class VocabularyPracticeSession {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column()
    @Index()
    vocabSetId!: number;

    @ManyToOne(() => VocabularySet, { onDelete: "CASCADE" })
    @JoinColumn({ name: "vocabSetId" })
    vocabularySet!: VocabularySet;

    @Column({ type: "enum", enum: VocabularyPracticeMode })
    mode!: VocabularyPracticeMode;

    @Column({ type: "timestamp" })
    startedAt!: Date;

    @Column({ type: "timestamp", nullable: true })
    endedAt!: Date | null;

    @Column({ type: "int", default: 0 })
    seenCount!: number;

    @Column({ type: "int", default: 0 })
    rememberedCount!: number;

    @Column({ type: "int", default: 0 })
    forgotCount!: number;

    @Column({ type: "int", default: 0 })
    correctCount!: number;

    @Column({ type: "int", default: 0 })
    wrongCount!: number;

    @OneToMany(() => VocabularyPracticeAnswer, (answer) => answer.session)
    answers!: VocabularyPracticeAnswer[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
