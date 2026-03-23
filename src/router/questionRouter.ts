import { Router } from "express";
import { QuestionController } from "../controller/questionController";
const questionController = new QuestionController()
const questionRouter = Router();

questionRouter.post("/questions", questionController.createQuestion);
questionRouter.get("/questions", questionController.getAllQuestions);
questionRouter.get("/questions/:questionId", questionController.getQuestionDetail);
export default questionRouter;