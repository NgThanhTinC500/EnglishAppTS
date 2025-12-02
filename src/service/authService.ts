import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { MoreThan } from 'typeorm';
import { User } from "../entity/User";
import { UserService } from "./userService";
// controller hoặc service
import sendEmail from "../utils/email";
import AppError from "../utils/appError";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "../interface/jwtPayload.interface";
import catchAsync from "../utils/catchAsync";

export class AuthService {
  constructor(private readonly userService: UserService) { }

  // Tạo JWT token dựa trên user id
  private signToken(userId: string) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  // Gửi token về client
  private createSendToken(user: User, statusCode: number, res: Response) {
    const token = this.signToken(user.id);
    const cookieOptions = {
      expires: new Date(
        Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("jwt", token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user
      },
    });
  }

  // SIGNUP
  signup = catchAsync(async (req: Request, res: Response, next : NextFunction) => {
    console.log("Kiem tra chuc nang")
    const { name, email, password, passwordConfirm } = req.body;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    const newUser = await this.userService.createUser({
      name, email, password, passwordConfirm
    });
    this.createSendToken(newUser, 201, res);
  })

  // LOGIN
  login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    console.log("da den day")
    this.createSendToken(user, 200, res);
  })

  // LOG OUT
  async logout(req: Request, res: Response) {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true // Ngăn JS truy cập cookie → tăng bảo mật
    })
    res.status(200).json({ status: 'success' })
  }


  async protect(req: Request, res: Response, next: NextFunction) {
    console.log('da chạy đến đây 0')
    // 1) Get token, 
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      // get cookies by name jwt
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in, please login to get access', 401),
      );
    }

    // 2) verify token
    // const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;


    // 3) Check if user still exists
    const currentUser = await this.userService.findOne(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The User belonging to this token does not exist', 401),
      );
    }

    console.log("da chạy đến đây 2")
    // 4) Check if user changed password after the token was issued
    console.log(currentUser.changedPasswordAfter(decoded.iat));
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password ! please log in again', 401),
      );
    }

    req.user = currentUser;
    console.log("da chạy đến đây 3")
    console.log(req.user)
    next();
  }

  // This should be a static method or regular method that RETURNS middleware
  // authService.ts
  restrictTo(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403),
        );
      }
      next();
    };
  }


  updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Check user exists
    const user = await this.userService.findOneWithPassword(req.user.id);
    console.log(user);
    console.log(req.user.id);
    // 2) Check if password  correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      // next(new AppError) == next(err)
      return next(new AppError('Your current password is wrong', 401))
    }
    // 3) oke thì update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;

    // không dùng save, vì save gọi @BeforeUpdate nên sẽ  trigger hook hashPassword
    await this.userService.updateUser(user.id, {
      password: user.password,
      passwordConfirm: user.passwordConfirm,
    });

    this.createSendToken(user, 200, res);
  })

  forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on POSTed email
    const user = await this.userService.findByEmail(req.body.email);
    if (!user) {
      return next(new AppError('There is no user with email address ', 404));
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await this.userService.saveResetToken(user); // Không gọi hook hashPassword

    // 3) Send it to user's email
    try {
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`,
      });
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      console.error('Email send error:', err.message);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  })

  resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    console.log("req.params.token:", req.params.token);
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    console.log("hashedToken:", hashedToken);
    const user = await this.userService.findByCondition({
      passwordResetToken: hashedToken,
      passwordResetExpires: MoreThan(new Date()),
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await this.userService.save(user);

    this.createSendToken(user, 201, res);
  })
}



