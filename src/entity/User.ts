import { IsNotEmpty, Min } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn  } from "typeorm"

@Entity()
@Unique(["email"])
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @IsNotEmpty({ message: "Name is required" })
    @Min(6, { message: "Name is too short" })
    name: string

    @Column()
    @IsNotEmpty({ message: "Name is required" })
    email: string

    @Column({ nullable: true })
    photo: String

    @Column()
    @IsNotEmpty({ message: "Name is required" })
    password: String

    @Column()
    @IsNotEmpty({ message: "Name is required" })
    passwordConfirm: String

    @Column({ default: "user" })
    role: String
    enum: ["user", "admin"]

    @Column({ default: true })
    isActive: Boolean

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date


}
