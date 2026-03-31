import { Router } from "express";
import { AuthController } from "../controller/authController";

const authRouter = Router();

const authController = new AuthController();
authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);



authRouter.use(authController.protect);
authRouter.get("/me", authController.getCurrentUser);
authRouter.patch("/updateMyPassword", authController.updatePassword);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password/:token', authController.resetPassword);
authRouter.post('/logout', authController.logout);

export default authRouter;
