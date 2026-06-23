import { User } from "../entity/User";
import "express";
import "multer";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
