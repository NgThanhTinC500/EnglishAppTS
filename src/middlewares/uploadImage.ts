import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../utils/appError";

const storage = multer.memoryStorage();

const allowedImageMimes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedImageMimes.has(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(new Error(`Invalid file type. Only image files are allowed. Received: ${file.mimetype}`));
};

export const uploadImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export const uploadImageSingle = uploadImage.single("image");

export const handleUploadImageError = (
    err: unknown,
    _req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return next(new AppError("Image too large. Max size is 5MB", 400));
        }

        return next(new AppError(`Upload error: ${err.message}`, 400));
    }

    if (err) {
        const message = err instanceof Error ? err.message : "Unknown upload error";
        return next(new AppError(message, 400));
    }

    next();
};
