import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { MoreThan } from "typeorm";
import { User } from "../entity/User";
import { UserService } from "./userService";
import sendEmail from "../utils/email";
import { AppError } from "../utils/appError";
import { JwtPayload } from "../interface/jwtPayload.interface";
import { Request } from "express";

export class AuthService {
  constructor(private readonly userService: UserService) { }

  signToken(userId: string): string {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  // SIGNUP
  async signup(data: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }): Promise<User> {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }
    const newUser = await this.userService.createUser(data);
    return newUser;
  }

  // LOGIN
  async login(
    email: string,
    password: string
  ): Promise<User> {
    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }
    const user = await this.userService.findByEmail(email);
    console.log("check: ", user)
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError("Incorrect email or password", 401);
    }
    return user;
  }

  // PROTECT — trả về user nếu hợp lệ, throw nếu không
  async protect(req: Request): Promise<User> {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new AppError("You are not logged in, please login to get access", 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    console.log(decoded)
    const currentUser = await this.userService.findOne(decoded.id);
    if (!currentUser) {
      throw new AppError("The user belonging to this token does not exist", 401);
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new AppError("User recently changed password! Please log in again", 401);
    }

    return currentUser;
  }

  // RESTRICT TO
  checkRole(userRole: string, roles: string[]): void {
    if (!roles.includes(userRole)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }
  }

  // UPDATE PASSWORD
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    passwordConfirm: string
  ): Promise<User> {
    const user = await this.userService.findOneWithPassword(userId);
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError("Your current password is wrong", 401);
    }

    // check confirm password
    if (newPassword !== passwordConfirm) {
      throw new AppError("Passwords do not match", 400);
    }

    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    await this.userService.save(user);
    // await this.userService.updateUser(user.id, {
    //   password: newPassword,
    //   passwordConfirm,
    // });

    // Trả về user mới nhất để controller tạo token
    const updatedUser = await this.userService.findOne(userId);
    return updatedUser;
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string, protocol: string, host: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new AppError("There is no user with that email address", 404);
    }

    const resetToken = user.createPasswordResetToken();
    await this.userService.saveResetToken(user);

    const resetURL = `${protocol}://${host}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await this.userService.saveResetToken(user);
      throw new AppError("There was an error sending the email. Try again later!", 500);
    }
  }

  // RESET PASSWORD
  async resetPassword(
    rawToken: string,
    password: string,
    passwordConfirm: string
  ): Promise<User> {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await this.userService.findByCondition({
      passwordResetToken: hashedToken,
      passwordResetExpires: MoreThan(new Date()),
    });

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await this.userService.save(user);
    return user;
  }
  async getme(userId: string): Promise<User> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}