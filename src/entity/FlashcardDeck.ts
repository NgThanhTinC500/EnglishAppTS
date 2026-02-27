import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Flashcard } from "./Flashcard";
import { User } from "./User";

import {
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    MaxLength
} from "class-validator";

@Entity("flashcard_decks")
export class FlashcardDeck {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int", nullable: true })
    @IsOptional()
    @IsInt({ message: "userId must be an integer" })
    @Min(1, { message: "userId must be greater than 0" })
    userId: number;

    @Column({ type: "varchar", length: 255 })
    @IsNotEmpty({ message: "Deck name is required" })
    @MaxLength(255, { message: "Deck name too long" })
    name: string;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    @MaxLength(1000, { message: "Description too long" })
    description: string;

    @Column({ type: "int", default: 0 })
    @IsInt({ message: "totalCards must be integer" })
    @Min(0, { message: "totalCards cannot be negative" })
    totalCards: number;

    @ManyToOne(
        () => User,
        user => user.flashcarddecks,
        { nullable: true, onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "userId" })
    user: User;

    @OneToMany(() => Flashcard, flashcard => flashcard.deck)
    flashcards: Flashcard[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}