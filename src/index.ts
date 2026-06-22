import * as dotenv from 'dotenv';
import express from "express";
import * as path from "path";
// import * as bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import userRouter from "./router/userRouter";
// import examRouter from "./router/examRouter";
import questionRouter from "./router/questionRouter";
import attemptRouter from "./router/attemptRouter";

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
import toeicCollectionRouter from "./router/toeicCollectionRouter";
import toeicExamSetRouter from "./router/toeicExamSetRouter";
import toeicExamPartRouter from "./router/toeicExamPartRouter";
import toeicQuestionGroupRouter from "./router/toeicQuestionGroupRouter";
import toeicQuestionRouter from "./router/toeicQuestionRouter";
import toeicExamSessionRouter from "./router/toeicExamSessionRouter";
import progressRouter from "./router/progressRouter";
import forumRouter from "./router/forumRouter";
import notificationRouter from "./router/notificationRouter";
import { getCorsOrigin } from "./utils/httpConfig";
dotenv.config();
import { createServer } from "http";
import { initSocket } from "./socket/index";
import { startToeicSessionExpirationJob } from "./jobs/toeicSessionExpirationJob";

console.log('NODE_ENV =', process.env.NODE_ENV);
const corsOptions = {
  origin: getCorsOrigin(),
  credentials: true,
};

AppDataSource.initialize()
  .then(async () => {

    // create express app
    const app = express();
    // Trust first proxy (e.g., Render, Vercel, or other reverse proxies)
    // so that express and express-rate-limit read the correct client IP
    // from the X-Forwarded-For header.
    app.set('trust proxy', 1);
    const server = createServer(app);

    initSocket(server);
    startToeicSessionExpirationJob();

    const limiter = rateLimit({
      max: 1000,
      windowMs: 60 * 60 * 1000,
      message: 'To many request from this IP, please try again'
    });

    // Serve uploaded files from a stable project-level public directory.
    app.use('/uploads', express.static(path.join(process.cwd(), 'public')));
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
    app.use("/api/v1", topicRouter);
    app.use("/api/v1", flashcardRouter);
    // app.use("/api/v1", examRouter);
    app.use("/api/v1", blogRouter);
    app.use("/api/v1", questionRouter);
    app.use("/api/v1", attemptRouter);
    app.use("/api/v1", courseRouter);
    app.use("/api/v1", lessonRouter);
    app.use("/api/v1", lectureRouter);
    app.use("/api/v1", commentRouter);
    app.use("/api/v1/toeic-collections", toeicCollectionRouter);
    app.use("/api/v1", toeicExamSetRouter);
    app.use("/api/v1", toeicExamPartRouter);
    app.use("/api/v1", toeicQuestionGroupRouter);
    app.use("/api/v1", toeicQuestionRouter);
    app.use("/api/v1", toeicExamSessionRouter);
    app.use("/api/v1", progressRouter);
    app.use("/api/forum", forumRouter);
    app.use("/api/notifications", notificationRouter);

    app.use(globalErrorHandler);

    // start express server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server đang chạy ở port ${PORT} (${process.env.NODE_ENV})`);
    });


  })
  .catch((error) => console.log(error));
