import * as dotenv from 'dotenv';
import express from "express";
import * as path from "path";
// import * as bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import userRouter from "./router/userRouter";
// import examRouter from "./router/examRouter";
import questionRouter from "./router/questionRouter";

import rateLimit from 'express-rate-limit';
import globalErrorHandler from './controller/errorController';
import flashcardRouter from "./router/vocabularyRouter";
import blogRouter from "./router/blogRouter";
import authRouter from "./router/authRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import topicRouter from "./router/topicRouter";
import courseRouter from "./router/courseRouter";
import lessonRouter from "./router/LessonRouter";
import lectureRouter from "./router/LectureRouter";
import commentRouter from './router/commenRouter';
dotenv.config();
import { createServer } from "http";
import { initSocket } from "./socket/index";

console.log('NODE_ENV =', process.env.NODE_ENV);
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

AppDataSource.initialize()
  .then(async () => {

    // create express app
    const app = express();
    const server = createServer(app);

    initSocket(server);

    const limiter = rateLimit({
      max: 1000,
      windowMs: 60 * 60 * 1000,
      message: 'To many request from this IP, please try again'
    });

    // Serve static files (e.g., images) from the "public" directory under the "/uploads" route
    app.use('/uploads', express.static(path.join(__dirname, 'public')));

    app.use(cors(corsOptions));
    app.use(express.json());
    
    // cookieParser to read cookies from incoming requests,
    //  allowing us to access them via req.cookies in our route handlers.
    app.use(cookieParser());
    app.use('/api', limiter);

    // setup express app here
    app.use("/api/v1/auth", authRouter);
    app.use("/api/v1", userRouter);
    app.use("/api/v1", flashcardRouter);
    // app.use("/api/v1", examRouter);
    app.use("/api/v1", blogRouter);
    app.use("/api/v1", questionRouter);
    app.use("/api/v1", topicRouter);
    app.use("/api/v1", courseRouter);
    app.use("/api/v1", lessonRouter);
    app.use("/api/v1", lectureRouter);
    app.use("/api/v1", commentRouter);

    app.use(globalErrorHandler);

    // start express server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server đang chạy ở port ${PORT} (${process.env.NODE_ENV})`);
    });


  })
  .catch((error) => console.log(error));
