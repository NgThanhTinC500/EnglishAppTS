/// <reference types="express" />
/// <reference types="multer" />

import { User } from "../entity/User";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
