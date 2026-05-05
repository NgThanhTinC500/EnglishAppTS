import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { VocabularySet } from "./VocabularySet";

@Entity("vocabulary")
export class Vocabulary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  word: string;

  @Column({ type: "text" })
  meaning: string;

  @Column({ nullable: true })
  pronunciation: string;

  @Column({ nullable: true })
  example: string;

  @Column()
  vocabSetId: number;

  @ManyToOne(
    () => VocabularySet,
    (vocabSet) => vocabSet.vocabularies,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "vocabSetId" })
  vocabSet: VocabularySet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}