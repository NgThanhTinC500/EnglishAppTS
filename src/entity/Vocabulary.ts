import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { VocabularySet } from "./VocabularySet";
// import { UserFlashcardProgress } from "./UserFlashcardProgress";

import {
    IsNotEmpty,
    IsInt,
    Min,
    MaxLength
} from "class-validator";

@Entity("vocabulary")
export class Vocabulary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    @IsNotEmpty({ message: "word text is required" })
    @MaxLength(255, { message: "word text too long" })
    word: string;

    @Column({ type: "text" })
    @IsNotEmpty({ message: "meaning text is required" })
    meaning: string;

    @Column({ nullable: true })
    pronunciation: string;

    @Column({ nullable: true })
    example: string;

    @Column()
    vocabSetId: number

    @ManyToOne(
        () => VocabularySet,
        vocabSet => vocabSet.vocabularies,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "vocabSetId" })
    vocabSet: VocabularySet;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}