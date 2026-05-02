import { Router } from "express";
import { QuestionController } from "../controller/questionController";
const questionController = new QuestionController()
const questionRouter = Router();

questionRouter.post("/questions", questionController.createQuestion);
questionRouter.get("/questions", questionController.getAllQuestions);
questionRouter.post("/questions/dictation/submit", questionController.submitDictationAnswer);
questionRouter.get("/questions/dictation/:questionId", questionController.getDictationQuestion);
questionRouter.get("/questions/:questionId", questionController.getQuestionDetail);
questionRouter.patch("/questions/:questionId", questionController.updateQuestion);
questionRouter.delete("/questions/:questionId", questionController.deleteQuestion);
export default questionRouter;
