import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ProgressController } from "../controller/progressController";

const progressRouter = Router();
const authController = new AuthController();
const progressController = new ProgressController();

progressRouter.get(
    "/progress/grammar",
    authController.protect,
    progressController.getGrammarProgress,
);
progressRouter.get(
    "/progress/vocabulary",
    authController.protect,
    progressController.getVocabularyProgress,
);
progressRouter.get(
    "/progress/listening",
    authController.protect,
    progressController.getListeningProgress,
);

export default progressRouter;
