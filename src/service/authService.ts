import * as jwt from "jsonwebtoken";
import { MoreThan } from "typeorm";
import { User } from "../entity/User";
import { UserService } from "./userService";
import { PasswordService } from "./passwordService";
import sendEmail from "../utils/email";
import { AppError } from "../utils/appError";
import { JwtPayload } from "../interface/jwtPayload.interface";
import { Request } from "express";

export class AuthService {
    private readonly passwordService = new PasswordService();

    constructor(private readonly userService: UserService) { }

    signToken(userId: string): string {
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d"; // fallback nếu undefined

        if (!jwtSecret) {
            throw new AppError("JWT secret is not configured", 500);
        }

        return jwt.sign(
            { id: userId },
            jwtSecret,
            {
                expiresIn: jwtExpiresIn,
            }
        );
    }

    async signup(data: {
        name: string;
        email: string;
        password: string;
        passwordConfirm: string;
    }): Promise<User> {
        const existingUser = await this.userService.findByEmail(data.email);

        if (existingUser) {
            throw new AppError("Email đã được sử dụng", 400);
        }

        const hashedPassword = await this.passwordService.hashPassword(data.password);

        return this.userService.createUser({
            name: data.name,
            email: data.email,
            password: hashedPassword,
        });
    }

    async login(email: string, password: string): Promise<User> {
        if (!email || !password) {
            throw new AppError("Vui lòng cung cấp email và mật khẩu", 400);
        }

        const user = await this.userService.findByEmail(email);

        if (!user || !user.isActive) {
            // 401 unauthorized
            throw new AppError("Sai email hoặc mật khẩu", 401);
        }

        const isPasswordCorrect = await this.passwordService.comparePassword(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            throw new AppError("Sai email hoặc mật khẩu", 401);
        }

        return user;
    }

    async protect(req: Request): Promise<User> {
        let token: string | undefined;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new AppError("Vui lòng đăng nhập để truy cập", 401);
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new AppError("JWT secret is not configured", 500);
        }

        let decoded: JwtPayload;

        try {
            // verify token and get payload
            decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        } catch {
            throw new AppError("Vui lòng đăng nhập để truy cập", 401);
        }

        const currentUser = await this.userService.findOne(decoded.id);

        if (!currentUser || !currentUser.isActive) {
            throw new AppError("The user belonging to this token does not exist", 401);
        }

        // compare  password change time && token issue time
        if (
            this.passwordService.changedPasswordAfter(
                currentUser.passwordChangedAt,
                decoded.iat
            )
        ) {
            throw new AppError("Đã thay đổi mật khẩu gần đây! Vui lòng đăng nhập lại", 401);
        }

        return currentUser;
    }

    checkRole(userRole: string, roles: string[]): void {
        if (!roles.includes(userRole)) {
            throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
        }
    }

    async updatePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
        passwordConfirm: string
    ): Promise<User> {
        const user = await this.userService.findOneWithPassword(userId);

        if (!user) {
            throw new AppError("Người dùng không tồn tại", 404);
        }

        const isCurrentPasswordCorrect = await this.passwordService.comparePassword(
            currentPassword,
            user.password
        );

        if (!isCurrentPasswordCorrect) {
            throw new AppError("Mật khẩu hiện tại của bạn sai", 401);
        }

        if (newPassword !== passwordConfirm) {
            throw new AppError("Mật khẩu không khớp", 400);
        }

        user.password = await this.passwordService.hashPassword(newPassword);
        user.passwordChangedAt = new Date(Date.now() - 1000);

        await this.userService.save(user);

        const updatedUser = await this.userService.findOne(userId);
        return updatedUser;
    }

    async forgotPassword(
        email: string,
        protocol: string,
        host: string
    ): Promise<void> {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new AppError("Không tồn tại người dùng với email này", 404);
        }

        const { rawToken, hashedToken, expiresAt } =
            this.passwordService.createPasswordResetToken();

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = expiresAt;

        await this.userService.saveResetToken(user);

        // send URL to user's email
        const resetURL = `${protocol}://${host}/reset-password/${rawToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: "Your password reset token (valid for 10 min)",
                message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`,
            });
        } catch {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await this.userService.saveResetToken(user);
            throw new AppError(
                "Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau!",
                500
            );
        }
    }

    async resetPassword(
        rawToken: string,
        password: string,
        passwordConfirm: string
    ): Promise<User> {
        const hashedToken = this.passwordService.hashResetToken(rawToken);

        const user = await this.userService.findOneBy({
            passwordResetToken: hashedToken,
            // check time token expires
            passwordResetExpires: MoreThan(new Date()),
        });

        if (!user) {
            throw new AppError("Token is invalid or has expired", 400);
        }

        if (password !== passwordConfirm) {
            throw new AppError("Mật khẩu không khớp", 400);
        }

        user.password = await this.passwordService.hashPassword(password);
        user.passwordChangedAt = new Date(Date.now() - 1000);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await this.userService.save(user);


        return user;
    }

    async getme(userId: string): Promise<User> {
        const user = await this.userService.findOne(userId);
        if (!user) {
            throw new AppError("Người dùng không tồn tại", 404);
        }

        return user;
    }
}
