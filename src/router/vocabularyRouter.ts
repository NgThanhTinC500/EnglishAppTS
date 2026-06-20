import { Router } from "express";
import { VocabularyController } from "../controller/vocabularyController";
import { AuthController } from "../controller/authController";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createVocabularySchema,
  createVocabularySetSchema,
  updateVocabularySchema,
  updateVocabularySetSchema,
} from "../validations/vocabulary.schema";

const vocabularyRouter = Router();
const vocabularyController = new VocabularyController();
const authController = new AuthController();

// Vocabulary sets
vocabularyRouter.post(
  "/vocabsets",
  authController.protect,
  authController.restrictTo("admin"),
  validateRequest(createVocabularySetSchema),
  vocabularyController.createVocabularySet
);
vocabularyRouter.get(
  "/vocabsets",
  authController.protect,
  vocabularyController.getAllVocabularySets
);
vocabularyRouter.get(
  "/vocabsets/:setId",
  authController.protect,
  vocabularyController.getVocabularySetDetail
);
vocabularyRouter.patch(
  "/vocabsets/:setId",
  authController.protect,
  authController.restrictTo("admin"),
  validateRequest(updateVocabularySetSchema),
  vocabularyController.updateVocabularySet
);
vocabularyRouter.delete(
  "/vocabsets/:setId",
  authController.protect,
  authController.restrictTo("admin"),
  vocabularyController.deleteVocabularySet
);

// Vocabularies in a set
vocabularyRouter.get(
  "/vocabsets/:setId/vocabs",
  authController.protect,
  vocabularyController.getVocabulariesBySetId
);

vocabularyRouter.get(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  authController.protect,
  vocabularyController.getVocabularyDetail
);
vocabularyRouter.post(
  "/vocabsets/:setId/vocabs",
  authController.protect,
  authController.restrictTo("admin"),
  validateRequest(createVocabularySchema),
  vocabularyController.createVocabulary
);
vocabularyRouter.patch(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  authController.protect,
  authController.restrictTo("admin"),
  validateRequest(updateVocabularySchema),
  vocabularyController.updateVocabulary
);
vocabularyRouter.delete(
  "/vocabsets/:setId/vocabs/:vocabularyId",
  authController.protect,
  authController.restrictTo("admin"),
  vocabularyController.deleteVocabulary
);

// Vocabulary practice
vocabularyRouter.get(
  "/vocabulary/lookup",
  authController.protect,
  authController.restrictTo("admin"),
  vocabularyController.lookupVocabulary
);
// get vocabulary practice items by vocabulary set id
vocabularyRouter.get(
  "/vocabsets/:setId/practice",
  authController.protect,
  vocabularyController.getVocabularyPracticeItems
);
vocabularyRouter.post(
  "/vocabulary/practice/check",
  authController.protect,
  vocabularyController.checkVocabularyPracticeAnswer
);
vocabularyRouter.post(
  "/vocabulary/practice-sessions",
  authController.protect,
  vocabularyController.startPracticeSession
);
vocabularyRouter.post(
  "/vocabulary/practice-sessions/:sessionId/spelling-answer",
  authController.protect,
  vocabularyController.submitSpellingAnswer
);

export default vocabularyRouter;
