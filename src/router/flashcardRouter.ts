import { Router } from "express";
import { FlashcardController } from "../controller/flashcardController";

const flashcardRouter = Router();

// route flashcardDeck
flashcardRouter.post("/create-deck", FlashcardController.createFlashcardDeck)
flashcardRouter.get("/get-all-deck", FlashcardController.getAllDeck)
flashcardRouter.get("/get-deck-byId/:id", FlashcardController.getDeckById)
flashcardRouter.patch("/update-deck/:id", FlashcardController.updateDeck)
flashcardRouter.delete("/delete-deck/:id", FlashcardController.deleteDeck)


// route flashcard

// lấy tất cả card dựa trên deckId
flashcardRouter.get("/:deckId/get-all-card", FlashcardController.getAllFlashcard)
// tạo card dựa trên deckId
flashcardRouter.post("/:id/create-flash-card", FlashcardController.createFlashCard)
// xóa card
flashcardRouter.delete("/delete-card/:id", FlashcardController.deleteCard)
// update card
flashcardRouter.patch("/update-card/:id", FlashcardController.updateflashcard)
export default flashcardRouter;