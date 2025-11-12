import { IsNotEmpty, MinLength } from "class-validator"
import { Entity, PrimaryGeneratedColumn, Column, Unique,BeforeInsert, BeforeUpdate } from "typeorm"
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';


export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}
@Entity()
@Unique(["email"])
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    @IsNotEmpty({ message: "Name is required" })
    @MinLength(6, { message: "Name is too short" })
    name: string

    @Column()
    @IsNotEmpty({ message: "Email is required" })
    email: string

    @Column({ nullable: true })
    photo: string

    @Column({ select: false })
    @IsNotEmpty({ message: "Password is required" })
    password: string

    @Column({ nullable: true })
    @IsNotEmpty({ message: "PasswordConfirm is required" })
    passwordConfirm: string

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole


    @Column({ default: true })
    isActive: boolean

    @Column({ type: 'timestamp', nullable: true })
    passwordChangedAt: Date;

    @Column({ type: 'text', nullable: true })
    passwordResetToken: string;

    @Column({ type: 'timestamp', nullable: true })
    passwordResetExpires: Date;


    @BeforeInsert()
    @BeforeUpdate() // chỉ trigger khi dùng save() 
    async hashPassword() {     // Hash password 
        try {
            if (this.password) {
                if (this.password !== this.passwordConfirm) {
                    throw new Error("Passwords do not match");
                }

                // 
                if (!this.password.startsWith("$2")) {
                    this.password = await bcrypt.hash(this.password, 12);
                    this.passwordConfirm = undefined;
                    // this.passwordChangedAt = Date.now() - 1000;
                }
            }
        } catch (error) {
            throw new Error("Error hashing password: " + error.message);
        }
    }


    
    // Create password reset token
    createPasswordResetToken(): string {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes        
        return resetToken;
    }

    // Compare password
    async correctPassword(candidatePassword: string, userPassword:string): Promise<boolean> {
        // console.log("candidatePassword:", candidatePassword);
        // console.log("userPassword:", userPassword);
        return await bcrypt.compare(candidatePassword, userPassword);
    }

    // kiểm tra xem mật khẩu đã bị đổi sau khi phát hành token hay chưa
    // mục đích: vô hiệu hóa token cũ khi người dùng đổi mật khẩu
    changedPasswordAfter(JWTTimestamp: number): boolean {
        if (this.passwordChangedAt) {
            const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
            return JWTTimestamp < changedTimestamp;
        }
        return false;
    }


}
