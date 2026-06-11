import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Vocabulary } from "./Vocabulary";
import { VocabularyPracticeSession } from "./VocabularyPracticeSession";
import {
    VocabularyPracticeMode,
    VocabularyPracticeResult,
} from "./VocabularyPracticeEnums";

@Entity("vocabulary_practice_answers")
export class VocabularyPracticeAnswer {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    sessionId!: number;

    @ManyToOne(() => VocabularyPracticeSession, (session) => session.answers, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "sessionId" })
    session!: VocabularyPracticeSession;

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

    @Column({ type: "enum", enum: VocabularyPracticeMode })
    mode!: VocabularyPracticeMode;

    @Column({ type: "enum", enum: VocabularyPracticeResult })
    result!: VocabularyPracticeResult;

    @Column({ type: "text", nullable: true })
    answerText!: string | null;

    @Column({ type: "timestamp" })
    answeredAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
