import { Router } from "express";
import { QuestionController } from "../controller/questionController";
import { handleUploadAudioError, uploadAudioSingle } from "../middlewares/uploadAudio";
import { AuthController } from "../controller/authController";
import { uploadSingleFileToCloudinary } from "../utils/cloudinary";
const questionController = new QuestionController()
const questionRouter = Router();
const authController = new AuthController();
const uploadQuestionAudioToCloudinary = uploadSingleFileToCloudinary({
    folder: "english-app/questions/audio",
    resourceType: "video",
});

questionRouter.post("/questions",  authController.protect, authController.restrictTo("admin"), uploadAudioSingle, handleUploadAudioError, uploadQuestionAudioToCloudinary, questionController.createQuestion);
questionRouter.get("/questions",  authController.protect, authController.restrictTo("admin"), questionController.getAllQuestions);
questionRouter.post("/questions/dictation/submit", authController.protect, questionController.submitDictationAnswer);
questionRouter.get("/questions/dictation/:questionId", authController.protect, questionController.getDictationQuestion);
questionRouter.get("/questions/:questionId", authController.protect, questionController.getQuestionDetail);
questionRouter.patch("/questions/:questionId", authController.protect, authController.restrictTo("admin"), uploadAudioSingle, handleUploadAudioError, uploadQuestionAudioToCloudinary, questionController.updateQuestion);
questionRouter.delete("/questions/:questionId", authController.protect, authController.restrictTo("admin"), questionController.deleteQuestion);

export default questionRouter;
