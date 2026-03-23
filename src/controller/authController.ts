import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/userService";
import { AuthService } from "../service/authService";
import { User } from "../entity/User";
import catchAsync from "../utils/catchAsync";

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userService = new UserService();
    this.authService = new AuthService(userService);
  }

  // Tạo và gửi token về client — thuộc Controller vì dùng res
  private createSendToken(user: User, statusCode: number, res: Response) {
    const token = this.authService.signToken(user.id);
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
      data: { user },
    });
  }

  signup = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await this.authService.signup({ name, email, password, passwordConfirm });
    this.createSendToken(newUser, 201, res);
  });

  login = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password } = req.body;
    const user = await this.authService.login(email, password);
    this.createSendToken(user, 200, res);
  });

  logout = (req: Request, res: Response) => {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: "success" });
  };

  protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = await this.authService.protect(req);
    req.user = currentUser;
    next();
  });

  restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      this.authService.checkRole(req.user.role, roles);
      next();
    };
  };

  getCurrentUser  = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await this.authService.getme(req.user.id);
    res.status(200).json({
      status: "success",
      data: { user },
    });
  });

  updatePassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const updatedUser = await this.authService.updatePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
      req.body.passwordConfirm
    );
    this.createSendToken(updatedUser, 200, res);
  });

  forgotPassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await this.authService.forgotPassword(
      req.body.email,
      req.protocol,
      req.get("host")
    );
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  });

  resetPassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await this.authService.resetPassword(
      String(req.params.token),
      req.body.password,
      req.body.passwordConfirm
    );
    this.createSendToken(user, 200, res);
  });
}