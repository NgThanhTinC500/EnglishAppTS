import { Router } from "express";
import { AuthController } from "../controller/authController";
import {
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
    signupSchema,
    updatePasswordSchema,
} from "../validations/auth.schema";
import { validateRequest } from "../middlewares/validateRequest";

const authRouter = Router();

const authController = new AuthController();

authRouter.post("/signup", validateRequest(signupSchema), authController.signup);
authRouter.post("/login", validateRequest(loginSchema), authController.login);
authRouter.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
authRouter.patch("/reset-password/:token", validateRequest(resetPasswordSchema), authController.resetPassword);
authRouter.post("/reset-password/:token", validateRequest(resetPasswordSchema), authController.resetPassword);


authRouter.post("/logout", authController.protect, authController.logout);
authRouter.get("/me", authController.protect, authController.getCurrentUser);
authRouter.patch("/update-my-password", authController.protect, validateRequest(updatePasswordSchema), authController.updatePassword);

export default authRouter;
