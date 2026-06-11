import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Vocabulary } from "./Vocabulary";
import { VocabularySet } from "./VocabularySet";

export enum VocabularyProgressStatus {
    LEARNING = "learning",
    MASTERED = "mastered",
    REVIEW = "review",
}

@Entity("user_vocabulary_progress")
@Unique(["userId", "vocabularyId"])
export class UserVocabularyProgress {
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
    vocabularyId!: number;

    @ManyToOne(() => Vocabulary, { onDelete: "CASCADE" })
    @JoinColumn({ name: "vocabularyId" })
    vocabulary!: Vocabulary;

    @Column()
    @Index()
    vocabSetId!: number;

    @ManyToOne(() => VocabularySet, { onDelete: "CASCADE" })
    @JoinColumn({ name: "vocabSetId" })
    vocabularySet!: VocabularySet;

    @Column({
        type: "enum",
        enum: VocabularyProgressStatus,
        default: VocabularyProgressStatus.LEARNING,
    })
    status!: VocabularyProgressStatus;

    @Column({ type: "int", default: 0 })
    flashcardSeenCount!: number;

    @Column({ type: "int", default: 0 })
    flashcardRememberedCount!: number;

    @Column({ type: "int", default: 0 })
    flashcardForgotCount!: number;

    @Column({ type: "int", default: 0 })
    spellingCorrectCount!: number;

    @Column({ type: "int", default: 0 })
    spellingWrongCount!: number;

    @Column({ type: "timestamp", nullable: true })
    lastPracticedAt!: Date | null;

    @Column({ type: "timestamp", nullable: true })
    nextReviewAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
