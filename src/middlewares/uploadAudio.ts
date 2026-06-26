import multer from "multer";
import { NextFunction, Request, Response } from "express";

//similar to uploadImage.ts, but for audio files
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/ogg",
        "audio/mp4",
        "audio/x-m4a",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(new Error(`Invalid file type. Only audio files are allowed. Received: ${file.mimetype}`));
};

export const uploadAudio = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export const uploadAudioSingle = uploadAudio.single("audio");

export const handleUploadAudioError = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "Audio too large. Maximum size is 10MB"
            });
        }

        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }

    if (err) {
        const message = err instanceof Error ? err.message : "Unknown upload error";
        return res.status(400).json({
            success: false,
            message
        });
    }

    next();
};
