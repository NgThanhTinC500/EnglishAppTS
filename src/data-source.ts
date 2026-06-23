import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Attempt } from "./entity/Attempt";
import { AttemptAnswer } from "./entity/AttemptAnswer";
import { Blog } from "./entity/Blog";
import { Comment } from "./entity/Comment";
import { CommentLike } from "./entity/CommentLike";
import { Course } from "./entity/Courses";
import { Exam } from "./entity/Exam";
import { ExamQuestion } from "./entity/ExamQuestion";
import { ForumComment } from "./entity/ForumComment";
import { ForumPost } from "./entity/ForumPost";
import { ForumPostLike } from "./entity/ForumPostLike";
import { Lecture } from "./entity/Lectures";
import { Lesson } from "./entity/Lesson";
import { Notification } from "./entity/Notification";
import { Question } from "./entity/Question";
import { QuestionOption } from "./entity/QuestionOption";
import { ToeicCollection } from "./entity/ToeicCollection";
import { ToeicExamPart } from "./entity/ToeicExamPart";
import { ToeicExamSession } from "./entity/ToeicExamSession";
import { ToeicExamSet } from "./entity/ToeicExamSet";
import { ToeicQuestion } from "./entity/ToeicQuestion";
import { ToeicQuestionGroup } from "./entity/ToeicQuestionGroup";
import { ToeicQuestionGroupImage } from "./entity/ToeicQuestionGroupImage";
import { ToeicQuestionOption } from "./entity/ToeicQuestionOption";
import { ToeicSessionAnswer } from "./entity/ToeicSessionAnswer";
import { Topic } from "./entity/Topic";
import { User } from "./entity/User";
import { UserVocabularyProgress } from "./entity/UserVocabularyProgress";
import { Vocabulary } from "./entity/Vocabulary";
import { VocabularyPracticeAnswer } from "./entity/VocabularyPracticeAnswer";
import { VocabularyPracticeSession } from "./entity/VocabularyPracticeSession";
import { VocabularySet } from "./entity/VocabularySet";

const isProd = process.env.NODE_ENV === "production";
const usesPostgresSsl =
  process.env.POSTGRES_SSL === "true" ||
  process.env.POSTGRES_SSL === "1" ||
  isProd;

export const AppDataSource = new DataSource({
  type: "postgres",
  // Support DATABASE_URL (Render, Heroku) or individual POSTGRES_* vars
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        username: process.env.POSTGRES_USERNAME,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
      }),
  synchronize: true, // keep disabled and use migrations
  logging: false, // display query in console , ex: SELECT * FROM ...
  entities: [
    Attempt,
    AttemptAnswer,
    Blog,
    Comment,
    CommentLike,
    Course,
    Exam,
    ExamQuestion,
    ForumComment,
    ForumPost,
    ForumPostLike,
    Lecture,
    Lesson,
    Notification,
    Question,
    QuestionOption,
    ToeicCollection,
    ToeicExamPart,
    ToeicExamSession,
    ToeicExamSet,
    ToeicQuestion,
    ToeicQuestionGroup,
    ToeicQuestionGroupImage,
    ToeicQuestionOption,
    ToeicSessionAnswer,
    Topic,
    User,
    UserVocabularyProgress,
    Vocabulary,
    VocabularyPracticeAnswer,
    VocabularyPracticeSession,
    VocabularySet,
  ],

  migrations: isProd
    ? ["build/migration/**/*.js"]
    : ["src/migration/**/*.ts"],

  subscribers: isProd
    ? ["build/subscriber/**/*.js"]
    : ["src/subscriber/**/*.ts"],
  ssl: usesPostgresSsl
    ? { rejectUnauthorized: false }
    : false,
});
// Standard migration workflow
// 1. Create or update entity
// 2. Generate migration: npx typeorm-ts-node-commonjs migration:generate ./src/migration/InitDB -d src/data-source.ts
// 3. Run migration: npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
