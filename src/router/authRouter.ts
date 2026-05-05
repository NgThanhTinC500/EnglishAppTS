import { Router } from "express";
import { AuthController } from "../controller/authController";
import { loginSchema, signupSchema } from "../schemas/auth.schema";
import { validateRequest } from "../middlewares/validateRequest";

const authRouter = Router();

const authController = new AuthController();
authRouter.post("/signup", validateRequest(signupSchema), authController.signup);
authRouter.post("/login", validateRequest(loginSchema), authController.login);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password/:token", authController.resetPassword);

// authController.restrictTo("admin", "user");

// authRouter.use(authController.protect);
authRouter.post("/logout", authController.protect, authController.logout);
authRouter.get("/me",authController.protect, authController.getCurrentUser);
authRouter.patch("/updateMyPassword", authController.protect, authController.updatePassword);

export default authRouter;
