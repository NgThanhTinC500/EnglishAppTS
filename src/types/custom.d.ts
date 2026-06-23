// src/types/custom.d.ts
import { User } from "../entity/User";
import type * as Multer from "multer";

// Source - https://stackoverflow.com/a/68641378
// Posted by Solz, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-10, License - CC BY-SA 4.0

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
    namespace Multer {
      interface File {}
    }
    interface Multer {
      File: any;
    }
  }
}


export {}; // ✅ dòng này bắt buộc để file được coi là module
