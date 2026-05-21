import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
    ManyToOne, OneToMany,
    JoinColumn
} from 'typeorm';
import { Lecture } from './Lectures';
import { User } from './User';
import { CommentLike } from './CommentLike';

@Entity('comments')

export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column("uuid")
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    lectureId: number;

    @ManyToOne(() => Lecture, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lectureId' })
    lecture: Lecture;

    @Column({ nullable: true })
    parentCommentId: number | null;

    @ManyToOne(() => Comment, comment => comment.replies, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentCommentId' })
    parentComment: Comment;

    @OneToMany(() => Comment, comment => comment.parentComment)
    replies: Comment[];

    @OneToMany(() => CommentLike, like => like.comment)
    likes: CommentLike[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
