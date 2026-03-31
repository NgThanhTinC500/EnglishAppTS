import { Request, Response } from "express";
import { VocabularyService } from "../service/vocabularyService";
import { json } from "stream/consumers";
import catchAsync from "../utils/catchAsync";

export class VocabularyController {
    private vocabularyService = new VocabularyService();

    // CONTROLLER WITH FLASH CARD DECK
    createVocabSets = catchAsync(async (req: Request, res: Response) => {
        console.log("test")
        const { name } = req.body;
        const userId = req.user.id;
        const deckData = {
            userId: userId,
            name: name,
        }
        const deck = await this.vocabularyService.createVocabSets(deckData)
        
        res.status(201).json({
            success: true,
            data: deck,
            message: "Deck created successfully"
        })
    })

    getAllVocabSets = catchAsync(async (req: Request, res: Response) => {
            const userId = req.user.id;
        const decks = await this.vocabularyService.getAllVocabSets(userId)
        res.status(200).json({
            success: true,
            result: decks.length,
            data: decks,
            message: "Lay tat ca deck",
        })
    })

    getVocabSetDetail = catchAsync(async (req: Request, res: Response) => {
        const deckId = Number(req.params.vocabsetsId)
        const deckItem = await this.vocabularyService.getVocabSetById(deckId)
        res.status(200).json({
            success: true,
            data: deckItem,
            message: "Get Deck by ID",
        })
    })

    updateVocabSets = catchAsync(async (req: Request, res: Response) => {
        const vocabsetsId = Number(req.params.vocabsetsId)
        const deckData = req.body
        const deckItem = await this.vocabularyService.updateVocabSets(deckData, vocabsetsId)
        res.status(200).json({
            success: true,
            data: deckItem,
            message: "Get Deck by ID",
        })
    })

    deleteVocabSets = catchAsync(async (req: Request, res: Response) => {
        const deckId = Number(req.params.vocabsetsId)
        await this.vocabularyService.deleteVocabSets(deckId)
        res.status(204).json({
            message: "Da xoa thanh cong"
        })
    })


    // CONTROLLER WITH FLASH CARD 

    createVocab = catchAsync(async (req: Request, res: Response) => {
        const deckId = Number(req.params.vocabsetsId)
        const flashcardData = req.body

        const flashcard = await this.vocabularyService.createVocabCard(deckId, flashcardData)
        res.status(201).json({
            success: true,
            data: flashcard,
            message: "TAO THANH CONG"
        })
    })


    updateVocab = catchAsync(async (req: Request, res: Response) => {
        const cardId = Number(req.params.vocabsId);
        const cardData = req.body
        if (!cardId) {
            throw new Error("KO co card Id nay")
        }
        const flashcard = await this.vocabularyService.updateVocabCard(cardId, cardData)
        res.status(201).json({
            success: true,
            data: flashcard,
            message: "UPDATE THANH CONG"
        })

    })

    deleteVocab = catchAsync(async (req: Request, res: Response) => {
        const cardId = Number(req.params.vocabsId);
        await this.vocabularyService.deleteVocabCard(cardId)
        res.status(204).json({
            message: "Da xoa thanh cong"
        })
    })

    getAllVocab = catchAsync(async (req: Request, res: Response) => {
        const deckId = Number(req.params.vocabsetsId);
        const allFlashcard = await this.vocabularyService.getAllVocab(deckId)
        res.status(200).json({
            data: allFlashcard,
            message: "Get thanh cong"
        })
    })
    getVocabDetail = catchAsync(async (req: Request, res: Response) => {
        const vocabsetsId = Number(req.params.vocabsetsId);
        const cardId = Number(req.params.vocabsId);
        const cardDetail = await this.vocabularyService.getVocabCardDetail(vocabsetsId, cardId)
        res.status(200).json({
            data: cardDetail,
            message: "Lay card detail thanh cong"
        })
    })
}