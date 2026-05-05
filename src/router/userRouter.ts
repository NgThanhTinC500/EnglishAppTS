import { Router } from "express";
import { UserController } from "../controller/userController";
import { AuthController } from "../controller/authController";

const userRouter = Router();

const authController = new AuthController();


userRouter.post("/user", UserController.create);
userRouter.get("/user/:id", UserController.findOne);
userRouter.put("/user/:id", UserController.update);


userRouter.get("/users", authController.protect, authController.restrictTo("admin"), UserController.all);
userRouter.patch("/user/:id/deactivate", authController.protect, authController.restrictTo("admin"), UserController.delete);

export default userRouter;
