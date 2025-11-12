import * as express from "express";
// import * as bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import userRouter from "./router/userRouter";
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import globalErrorHandler from './controller/errorController';
dotenv.config();

console.log('NODE_ENV =', process.env.NODE_ENV);
AppDataSource.initialize()
  .then(async () => {

    // create express app
    const app = express();

    const limiter = rateLimit({
      max: 100,
      windowMs: 60 * 60 * 1000,
      message: 'To many request from this IP, please try again'
    });


    app.use(express.json());
    app.use('/api', limiter);
    // setup express app here
    app.use("/api/v1/", userRouter);

    // start express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server đang chạy ở port ${PORT} (${process.env.NODE_ENV})`);
    });

    app.use(globalErrorHandler);
  })
  .catch((error) => console.log(error));
