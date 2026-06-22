import { Router } from "express";
import { UserController } from "../controller/userController";
import { AuthController } from "../controller/authController";
import { handleUploadImageError, uploadImageSingle } from "../middlewares/uploadImage";

const userRouter = Router();

const authController = new AuthController();

userRouter.get("/user/:id", UserController.findOne);
userRouter.put("/user/:id", authController.protect, authController.restrictTo("admin"), UserController.update);
userRouter.patch("/users/me", authController.protect, uploadImageSingle, handleUploadImageError, UserController.updateMe);
userRouter.get("/users", authController.protect, authController.restrictTo("admin"), UserController.all);
userRouter.patch("/users/:id/role", authController.protect, authController.restrictTo("admin"), UserController.toggleRole);
userRouter.patch("/user/:id/deactivate", authController.protect, authController.restrictTo("admin"), UserController.delete);

export default userRouter;
