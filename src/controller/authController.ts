import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/userService";
import { AuthService } from "../service/authService";
import { User } from "../entity/User";
import catchAsync from "../utils/catchAsync";
import { getJwtCookieOptions } from "../utils/httpConfig";

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userService = new UserService();
    this.authService = new AuthService(userService);
  }

  // Tạo và gửi token về client — thuộc Controller vì dùng res
  private createSendToken(user: User, statusCode: number, res: Response) {
    const token = this.authService.signToken(user.id);
    const cookieExpiresIn = Number(process.env.JWT_COOKIE_EXPIRES_IN || 90);
    const cookieOptions = getJwtCookieOptions(
      new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000)
    );

    res.cookie("jwt", token, cookieOptions);
    const { password: _password, ...safeUser } = user;
    res.status(statusCode).json({
      status: "success",
      user: safeUser,
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

  logout = (_req: Request, res: Response) => {
    res.cookie("jwt", "loggedout", {
      ...getJwtCookieOptions(new Date(Date.now() + 10 * 1000)),
    });
    res.status(200).json({ status: "success" });
  };

  protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = await this.authService.protect(req);
    req.user = currentUser;
    next();
  });

  optionalProtect = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const currentUser = await this.authService.protect(req);
      req.user = currentUser;
    } catch {
      req.user = undefined;
    }

    next();
  };

  restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      this.authService.checkRole(req.user.role, roles);
      next();
    };
  };

  getCurrentUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
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
    const clientUrl =
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      req.get("origin") ||
      `${req.protocol}://${req.get("host")}`;

    await this.authService.forgotPassword(
      req.body.email,
      clientUrl
    );
    res.status(200).json({
      status: "success",
      message: "If this email exists, reset instructions have been sent.",
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
