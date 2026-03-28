import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { FlashcardDeck } from "./FlashcardDeck";
// import { UserFlashcardProgress } from "./UserFlashcardProgress";

import {
    IsNotEmpty,
    IsInt,
    Min,
    MaxLength
} from "class-validator";

@Entity("flashcards")
export class Flashcard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    @IsInt({ message: "deckId must be an integer" })
    @Min(1, { message: "deckId must be greater than 0" })
    deckId: number;

    @Column({ type: "varchar", length: 255 })
    @IsNotEmpty({ message: "Front text is required" })
    @MaxLength(255, { message: "Front text too long" })
    front: string;

    @Column({ type: "text" })
    @IsNotEmpty({ message: "Back text is required" })
    back: string;

    @ManyToOne(
        () => FlashcardDeck,
        deck => deck.flashcards,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "deckId" })
    deck: FlashcardDeck;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}