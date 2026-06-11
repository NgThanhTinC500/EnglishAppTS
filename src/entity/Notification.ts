import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

export enum NotificationType {
    NEW_COMMENT = "new_comment",
}

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "user_id", type: "uuid" })
    @Index()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({
        type: "enum",
        enum: NotificationType,
    })
    type!: NotificationType;

    @Column({ type: "jsonb" })
    payload!: Record<string, unknown>;

    @Column({ name: "is_read", type: "boolean", default: false })
    isRead!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
