import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Flashcard } from "./Flashcard";
import { User } from "./User";

@Entity("flashcard_decks")
export class FlashcardDeck {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int", nullable: true })
    userId: number; // Null = public deck, có userId = private deck

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "int", default: 0 })
    totalCards: number;

    @ManyToOne(() => User, (user) => user.flashcarddecks, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    // thuộc tinh, dai dien cho bản ghi User mà flashCardDeck thuộc về
    user: User;

    @OneToMany(() => Flashcard, (flashcard) => flashcard.deck)
    flashcards: Flashcard[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}