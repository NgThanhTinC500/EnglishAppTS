import { Router } from "express";
import { QuestionController } from "../controller/questionController";
import { handleUploadAudioError, uploadAudioSingle } from "../middlewares/uploadAudio";
const questionController = new QuestionController()
const questionRouter = Router();

questionRouter.post("/questions", uploadAudioSingle, handleUploadAudioError, questionController.createQuestion);
questionRouter.get("/questions", questionController.getAllQuestions);
questionRouter.post("/questions/dictation/submit", questionController.submitDictationAnswer);
questionRouter.get("/questions/dictation/:questionId", questionController.getDictationQuestion);
questionRouter.get("/questions/:questionId", questionController.getQuestionDetail);
questionRouter.patch("/questions/:questionId", uploadAudioSingle, handleUploadAudioError, questionController.updateQuestion);
questionRouter.delete("/questions/:questionId", questionController.deleteQuestion);

export default questionRouter;
