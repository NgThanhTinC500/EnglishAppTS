import { Router } from "express";
import { VocabularyController } from "../controller/vocabularyController";
import { AuthController } from "../controller/authController";

const flashcardRouter = Router();
const vocabularyController = new VocabularyController()
const authController = new AuthController()

flashcardRouter.use(authController.protect)

// ROUTE FLASHCARD DECK
flashcardRouter.post("/vocabsets", vocabularyController.createVocabSets)
flashcardRouter.get("/vocabsets", vocabularyController.getAllVocabSets)
flashcardRouter.get("/vocabsets/:vocabsetsId", vocabularyController.getVocabSetDetail)
flashcardRouter.patch("/vocabsets/:vocabsetsId", vocabularyController.updateVocabSets)
flashcardRouter.delete("/vocabsets/:vocabsetsId/status", vocabularyController.deleteVocabSets)


// ROUTE FLASHCARD
flashcardRouter.get("/vocabsets/:vocabsetsId/vocabs", vocabularyController.getAllVocab)
flashcardRouter.get("/vocabsets/:vocabsetsId/vocabs/:vocabsId", vocabularyController.getVocabDetail)
flashcardRouter.post("/vocabsets/:vocabsetsId/vocabs", vocabularyController.createVocab)
flashcardRouter.patch("/vocabsets/:vocabsetsId/vocabs/:vocabsId", vocabularyController.updateVocab)
flashcardRouter.delete("/vocabsets/:vocabsetsId/vocabs/:vocabsId", vocabularyController.deleteVocab)
export default flashcardRouter;