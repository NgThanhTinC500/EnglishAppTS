import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const audioDir = path.resolve(process.cwd(), "public/toeic/audio");
const imageDir = path.resolve(process.cwd(), "public/toeic/images");

[audioDir, imageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const audioMimes = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
]);

const imageMimes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
]);

function isAudio(file: Express.Multer.File) {
    return file.fieldname === "audio" && audioMimes.has(file.mimetype);
}

function isImage(file: Express.Multer.File) {
    return file.fieldname === "images" && imageMimes.has(file.mimetype);
}

const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        if (isAudio(file)) return cb(null, audioDir);
        if (isImage(file)) return cb(null, imageDir);
        return cb(new Error(`Invalid TOEIC media field or type: ${file.fieldname}/${file.mimetype}`), "");
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (isAudio(file) || isImage(file)) {
        cb(null, true);
        return;
    }

    cb(new Error(`Invalid TOEIC media type. Received: ${file.fieldname}/${file.mimetype}`));
};

export const uploadToeicMedia = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 11,
    },
});

export const uploadToeicGroupMedia = uploadToeicMedia.fields([
    { name: "audio", maxCount: 1 },
    { name: "images", maxCount: 10 },
]);

export const uploadToeicAudioSingle = uploadToeicMedia.single("audio");
export const uploadToeicImages = uploadToeicMedia.array("images", 10);

export function handleUploadToeicMediaError(
    err: any,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            status: "fail",
            message: `Upload error: ${err.message}`,
        });
    }

    if (err) {
        const message = err instanceof Error ? err.message : "Unknown upload error";
        return res.status(400).json({
            status: "fail",
            message,
        });
    }

    next();
}

export function toToeicMediaUrl(file: Express.Multer.File) {
    const folder = file.fieldname === "audio" ? "audio" : "images";
    return `/uploads/toeic/${folder}/${file.filename}`;
}
