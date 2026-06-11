import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/appError";

export const validateRequest =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      return next(new AppError(message, 400));
    }

    const data = result.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    req.body = data.body ?? req.body;
    req.params = (data.params ?? req.params) as Request["params"];

    // Không gán lại req.query vì Express mới chỉ cho getter
    res.locals.validatedQuery = data.query ?? req.query;

    next();
  };
