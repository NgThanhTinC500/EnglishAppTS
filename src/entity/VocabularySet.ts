import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Vocabulary } from "./Vocabulary";
import { User } from "./User";

import {
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    MaxLength
} from "class-validator";

@Entity("vocabulary_sets")
export class VocabularySet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    @IsNotEmpty({ message: "Deck name is required" })
    @MaxLength(255, { message: "Deck name too long" })
    name: string;

    @Column()
    userId: string
    
    @ManyToOne(() => User, user => user.vocabularySets,
        { nullable: true, onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "userId" })
    user: User;

    @OneToMany(() => Vocabulary, vocabulary => vocabulary.vocabSet)
    vocabularies: Vocabulary[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}