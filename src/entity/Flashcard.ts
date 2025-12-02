import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { FlashcardDeck } from "./FlashcardDeck";
// import { UserFlashcardProgress } from "./UserFlashcardProgress";

@Entity("flashcards")
export class Flashcard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    deckId: number;

    @Column({ type: "varchar", length: 255 })
    front: string; // Từ vựng (English)

    @Column({ type: "text" })
    back: string; // Nghĩa (Vietnamese)

    // @Column({ type: "varchar", length: 100, nullable: true })
    // pronunciation: string; // Phát âm (IPA)

    @ManyToOne(() => FlashcardDeck, (deck) => deck.flashcards, { onDelete: "CASCADE" })
    @JoinColumn({ name: "deckId" })
    deck: FlashcardDeck;    

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}