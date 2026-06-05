import { Router } from "express";
import { QuestionController } from "../controller/questionController";
import { handleUploadAudioError, uploadAudioSingle } from "../middlewares/uploadAudio";
import { AuthController } from "../controller/authController";
const questionController = new QuestionController()
const questionRouter = Router();
const authController = new AuthController();

questionRouter.post("/questions",  authController.protect, authController.restrictTo("admin"), uploadAudioSingle, handleUploadAudioError, questionController.createQuestion);
questionRouter.get("/questions",  authController.protect, authController.restrictTo("admin"), questionController.getAllQuestions);
questionRouter.post("/questions/dictation/submit", authController.protect, questionController.submitDictationAnswer);
questionRouter.get("/questions/dictation/:questionId",  questionController.getDictationQuestion);
questionRouter.get("/questions/:questionId", questionController.getQuestionDetail);
questionRouter.patch("/questions/:questionId", authController.protect, authController.restrictTo("admin"), uploadAudioSingle, handleUploadAudioError, questionController.updateQuestion);
questionRouter.delete("/questions/:questionId", authController.protect, authController.restrictTo("admin"), questionController.deleteQuestion);

export default questionRouter;
