import multer from 'multer';
import * as path from "path";
import * as fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// __dirname là thư mục hiện tại: src/middlewares
const uploadDir = path.resolve(__dirname, "../public/audio");
if (!fs.existsSync(uploadDir)) { // existsSync => kiểm tra thư mục tồn tại
    fs.mkdirSync(uploadDir, { recursive: true }); // mkdirSync => tạo thư mục tự động
}

// Cấu hình storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // không lỗi, lưu file vào uploadDir
    },
    filename: (req, file, cb) => {
        // Tạo tên file unique: uuid-timestamp.mp3
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName); // khong lỗi, tạo ra tên 
    }
});

// File filter - chỉ cho phép audio files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Các định dạng audio cho phép
    const allowedMimes = [
        'audio/mpeg',      // .mp3
        'audio/mp3',       // .mp3
        'audio/wav',       // .wav
        'audio/x-wav',     // .wav
        'audio/ogg',       // .ogg
        'audio/mp4',       // .m4a
        'audio/x-m4a',     // .m4a
    ];

    // kiểm tra xem đúng định dạng ko
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only audio files are allowed. Received: ${file.mimetype}`));
    }
};

// Cấu hình multer
export const uploadAudio = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
    }
});

export const uploadAudioSingle = uploadAudio.single('audio'); 
// key trong data-form la audio

// Middleware xử lý lỗi upload
// export const handleUploadError = (err: any, req: any, res: any, next: any) => {
//     if (err instanceof multer.MulterError) {
//         if (err.code === 'LIMIT_FILE_SIZE') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'File too large. Maximum size is 10MB'
//             });
//         }
//         return res.status(400).json({
//             success: false,
//             message: `Upload error: ${err.message}`
//         });
//     } else if (err) {
//         return res.status(400).json({
//             success: false,
//             message: err.message
//         });
//     }
//     next();
// };
