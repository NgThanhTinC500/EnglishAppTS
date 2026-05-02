import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsUrl,
    MaxLength,
    MinLength,
} from "class-validator";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { VocabularySet } from "./VocabularySet";
import { Blog } from "./Blog";
import { Attempt } from "./Attempt";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

// entities/User.ts
@Entity()
@Unique(["email"])
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    email: string

    @Column({ nullable: true })
    photo: string

    @Column({ select: false })
    password: string

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole

    @Column({ default: true })
    isActive: boolean

    @Column({ type: 'timestamp', nullable: true })
    passwordChangedAt: Date

    @Column({ type: 'text', nullable: true })
    passwordResetToken: string

    @Column({ type: 'timestamp', nullable: true })
    passwordResetExpires: Date

    @OneToMany(() => VocabularySet, (v) => v.user)
    vocabularySets: VocabularySet[]

    @OneToMany(() => Blog, (b) => b.author)
    blogs: Blog[]

    @OneToMany(() => Attempt, (a) => a.user)
    attempts: Attempt[]

    // ✅ Chỉ giữ @BeforeInsert, bỏ @BeforeUpdate
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password && !this.password.startsWith("$2")) {
            this.password = await bcrypt.hash(this.password, 12)
            this.passwordChangedAt = new Date(Date.now() - 1000)
        }
    }

    createPasswordResetToken(): string {
        const resetToken = crypto.randomBytes(32).toString('hex')
        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000)
        return resetToken
    }

    async correctPassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password)
    }

    changedPasswordAfter(JWTTimestamp: number): boolean {
        if (this.passwordChangedAt) {
            const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000)
            return JWTTimestamp < changedTimestamp
        }
        return false
    }
}
