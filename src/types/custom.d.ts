import 'multer'; // 🌟 Ép TypeScript phải nạp toàn bộ thuộc tính mặc định của Multer (filename, path, mimetype...)
import { User } from "../entity/User"; // Đảm bảo đường dẫn này đúng với thực tế dự án của bạn

declare global {
  namespace Express {
    interface Request {
      user?: User; // 🌟 Chỉ giữ lại duy nhất dòng mở rộng thuộc tính 'user' này thôi!
    }
  }
}

export {}; // Bắt buộc phải có để file được tính là một module
