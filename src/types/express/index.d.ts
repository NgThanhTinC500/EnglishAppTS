// src/types/express.d.ts
import { User } from "../../entity/User";

// Source - https://stackoverflow.com/a/68641378
// Posted by Solz, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-10, License - CC BY-SA 4.0

import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string,any>
    }
  }
}


export {}; // ✅ dòng này bắt buộc để file được coi là module