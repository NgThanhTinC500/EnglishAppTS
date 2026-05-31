import { Router } from "express";
import { VocabularyController } from "../controller/vocabularyController";
import { AuthController } from "../controller/authController";

const vocabularyRouter = Router();
const vocabularyController = new VocabularyController();
const authController = new AuthController();

vocabularyRouter.use(authController.protect);

// Vocabulary sets
vocabularyRouter.post(
  "/vocabsets",
  authController.restrictTo("admin"),
  vocabularyController.createVocabularySet
);
vocabularyRouter.get(
  "/vocabsets",
  vocabularyController.getAllVocabularySets
);
vocabularyRouter.get(
  "/vocabsets/:setId",
  vocabularyController.getVocabularySetDetail
);
vocabularyRouter.patch(
  "/vocabsets/:setId",
  authController.restrictTo("admin"),
  vocabularyController.updateVocabularySet
);
vocabularyRouter.delete(
  "/vocabsets/:setId",
  authController.restrictTo("admin"),
  vocabularyController.deleteVocabularySet
);

// Vocabularies in a set
vocabularyRouter.get(
  "/vocabsets/:setId/vocabs",
  vocabularyController.getVocabulariesBySetId
);

vocabularyRouter.get(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  vocabularyController.getVocabularyDetail
);
vocabularyRouter.post(
  "/vocabsets/:setId/vocabs",
  authController.restrictTo("admin"),
  vocabularyController.createVocabulary
);
vocabularyRouter.patch(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  authController.restrictTo("admin"),
  vocabularyController.updateVocabulary
);
vocabularyRouter.delete(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  authController.restrictTo("admin"),
  vocabularyController.deleteVocabulary
);

// Vocabulary practice
// get vocabulary practice items by topic id
vocabularyRouter.get(
  "/vocabulary/topics/:topicId/practice",
  vocabularyController.getVocabularyPracticeItems
);
vocabularyRouter.post(
  "/vocabulary/practice/check",
  vocabularyController.checkVocabularyPracticeAnswer
);

export default vocabularyRouter;
