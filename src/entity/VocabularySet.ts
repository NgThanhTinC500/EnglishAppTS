import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from "typeorm";

import { Vocabulary } from "./Vocabulary";
import { User } from "./User";

@Entity("vocabulary_sets")
export class VocabularySet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ nullable: true })
  tag: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.vocabularySets, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => Vocabulary, (vocabulary) => vocabulary.vocabSet)
  vocabularies: Vocabulary[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}