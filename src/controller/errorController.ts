import { Request, Response } from 'express';

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {

  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  } else {
   
    console.error('ERROR ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};

export default globalErrorHandler;