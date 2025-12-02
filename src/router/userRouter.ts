import { Router } from "express";
import { UserController } from "../controller/userController";
import { AuthController } from "../controller/authController";

const userRouter = Router();


userRouter.post("/signup", AuthController.signup);
userRouter.post("/login", AuthController.login);
userRouter.post('/forgotPassword', AuthController.forgotPassword);
userRouter.patch('/resetPassword/:token', AuthController.resetPassword);



userRouter.use(AuthController.protect);

userRouter.patch("/updateMyPassword", AuthController.updatePassword);

// userRouter.use(AuthController.restricTo("admin"));

userRouter.get("/users", UserController.all);
userRouter.post("/users", UserController.create);
userRouter.get("/users/:id", UserController.findOne);
userRouter.patch("/users/:id", UserController.update);
userRouter.delete("/users/:id", UserController.delete);

export default userRouter;
