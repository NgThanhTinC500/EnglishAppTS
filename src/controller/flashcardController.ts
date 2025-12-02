import { Request, Response } from "express";
import { FlashcardService } from "../service/flashcardService";
import { json } from "stream/consumers";

const flashcardService = new FlashcardService();

export class FlashcardController {


    // CONTROLLER WITH FLASH CARD DECK
    static async createFlashcardDeck(req: Request, res: Response) {
        const { name, description } = req.body;
        const userId = req.user.id
        const deckData = {
            userId: userId,
            name: name,
            description: description
        }
        const deck = await flashcardService.createDeck(deckData)
        res.status(201).json({
            success: true,
            data: deck,
            message: "Deck created successfully"
        })
    }

    static async getAllDeck(req: Request, res: Response) {
        const allDeck = await flashcardService.getAllDeck()
        res.status(200).json({
            success: true,
            data: allDeck,
            message: "Lay tat ca deck",
        })
    }

    static async getDeckById(req: Request, res: Response) {
        const deckId = req.params.id
        const deckItem = await flashcardService.getDeckbyId(deckId)
        res.status(200).json({
            success: true,
            data: deckItem,
            message: "Get Deck by ID",
        })
    }
    static async updateDeck(req: Request, res: Response) {
        const deckId = req.params.id
        const deckData = req.body
        const deckItem = await flashcardService.updateDeck(deckData, deckId)
        res.status(200).json({
            success: true,
            data: deckItem,
            message: "Get Deck by ID",
        })
    }
    static async deleteDeck(req: Request, res: Response) {
        const deckId = req.params.id
        await flashcardService.deleteDeck(deckId)
        res.status(204).json({
            message: "Da xoa thanh cong"
        })
    }


    // CONTROLLER WITH FLASH CARD 

    static async createFlashCard(req: Request, res: Response) {
        const deckId = req.params.id
        const { front, back } = req.body

        const flashcard = {
            deckId: deckId,
            front: front,
            back: back
        }
        const flashcardData = await flashcardService.createflashcard(flashcard)
        res.status(201).json({
            success: true,
            data: flashcardData,
            message: "TAO THANH CONG"
        })
    }


    static async updateflashcard(req: Request, res: Response) {
        const cardId = req.params.id;
        const cardData = req.body
        if (!cardId) {
            throw new Error("KO co card Id nay")
        }
        const flashcard = await flashcardService.updateflashcard(cardId, cardData)
        res.status(201).json({
            success: true,
            data: flashcard,
            message: "UPDATE THANH CONG"
        })

    }

    static async deleteCard(req: Request, res: Response) {
        const cardId = req.params.id
        await flashcardService.deleteCard(cardId)
        res.status(204).json({
            message: "Da xoa thanh cong"
        })
    }

    static async getAllFlashcard(req: Request, res: Response) {
        const deckId = req.params.deckId
        const allFlashcard = await flashcardService.getAllflashcard(deckId)
        res.status(200).json({
            data: allFlashcard,
            message: "Get thanh cong"
        })
    }
}