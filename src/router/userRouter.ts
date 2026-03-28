import { Router } from "express";
import { UserController } from "../controller/userController";

const userRouter = Router();

userRouter.get("/users", UserController.all);
userRouter.post("/user", UserController.create);
userRouter.get("/user/:id", UserController.findOne);
userRouter.put("/user/:id", UserController.update);
userRouter.patch("/user/:id/deactivate", UserController.delete);

export default userRouter;
