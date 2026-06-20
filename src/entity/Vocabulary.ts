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
  id!: number;

  @Column({ type: "varchar", length: 255 })
  word!: string;

  @Column({ type: "text" })
  meaning!: string;

  @Column({ nullable: true })
  pronunciation!: string | null;

  @Column({ type: "text", nullable: true })
  audioUrl!: string | null;

  @Column({ type: "text", nullable: true })
  audioUsUrl!: string | null;

  @Column({ type: "text", nullable: true })
  audioUkUrl!: string | null;

  @Column({ nullable: true })
  example!: string | null;

  @Column({ type: "text", nullable: true })
  exampleVi!: string | null;

  @Column()
  vocabSetId!: number;

  @ManyToOne(
    () => VocabularySet,
    (vocabularySet) => vocabularySet.vocabularies,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "vocabSetId" })
  vocabularySet!: VocabularySet;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
