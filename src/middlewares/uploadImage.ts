import multer from "multer"; // handle multipart/form-data, which is primarily used for uploading files
import path from "path"; // provides utilities for working with file and directory paths
import fs from "fs"; // provides an API for interacting with the file system in a manner closely modeled around standard POSIX functions
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
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

// create uploads directory if not exist
const uploadDir = path.resolve(__dirname, "../public/img");

// Check if the upload directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// configure storage
// disStorage: save file to disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // uuidv4() generates a unique identifier, Date.now() adds a timestamp, 
        // and path.extname(file.originalname) preserves the original file extension. 
        // This ensures that each uploaded file has a unique name, preventing overwriting of existing files and maintaining the correct file type.
        // path.extname(file.originalname) returns the file extension (e.g., .jpg, .png)
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

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

