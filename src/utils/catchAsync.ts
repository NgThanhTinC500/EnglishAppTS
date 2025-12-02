import { Request, Response, NextFunction } from 'express';

// catchAsync là hàm bọc (wrapper) cho các hàm async controller
// giúp tự động bắt lỗi (thay vì phải dùng try-catch thủ công)
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
     // nếu fn gây lỗi, .catch(next) sẽ tự động gửi lỗi về middleware xử lý lỗi của Express.

  };
};
// catch.next bắt lỗi promise và gọi next(err)
export default catchAsync;
