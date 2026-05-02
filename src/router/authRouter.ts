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
authRouter.post("/logout", authController.logout);

authRouter.use(authController.protect);
authRouter.get("/me", authController.getCurrentUser);
authRouter.patch("/updateMyPassword", authController.updatePassword);

export default authRouter;
