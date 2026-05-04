import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

export class PasswordService {
    private readonly saltRounds = 12;

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async comparePassword(
        candidatePassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        return bcrypt.compare(candidatePassword, hashedPassword);
    }

    createPasswordResetToken(): {
        rawToken: string;
        hashedToken: string;
        expiresAt: Date;
    } {
        const rawToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        return {
            rawToken,
            hashedToken,
            expiresAt,
        };
    }

    hashResetToken(rawToken: string): string {
        return crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");
    }

    changedPasswordAfter(
        passwordChangedAt: Date | null | undefined,
        jwtTimestamp: number
    ): boolean {
        if (!passwordChangedAt) return false;

        const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);
        return jwtTimestamp < changedTimestamp;
    }
}
