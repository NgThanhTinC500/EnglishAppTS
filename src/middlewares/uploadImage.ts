import multer from "multer"; // handle multipart/form-data, which is primarily used for uploading files
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";

/*
    Flow handle upload image:

    Client send file
        ↓
    multer receive request multipart/form-data
        ↓
    multer check file type
        ↓
    check size file
        ↓
    create unique name for file
        ↓
    save to public/img
        ↓
    req.file contains file information
        ↓
    controller processes further
*/

// when user choose file, multer will save file to disk
// and add file information to req.file, then call next() to pass control to the next middleware or route handler. If there is an error during the upload process (e.g., invalid file type, file too large), multer will pass an error to

const storage = multer.memoryStorage();

// Only allow image files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only image files are allowed. Received: ${file.mimetype}`));
    }
};

// Configure multer
export const uploadImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Upload only 1 image
/*
(req, res, next) => {
    multer handle file
if success:
    next();
if error:
  next(err);
}
*/
export const uploadImageSingle = uploadImage.single("image");

// Middleware  handle error upload
export const handleUploadImageError = (
    err: any,
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

