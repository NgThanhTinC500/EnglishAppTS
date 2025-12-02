import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";
import { FlashcardDeck } from "../entity/FlashcardDeck";
import { Flashcard } from "../entity/Flashcard";

export class FlashcardService {
    private flashRepository = AppDataSource.getRepository(Flashcard)
    private flashdeckRepository = AppDataSource.getRepository(FlashcardDeck)


    // CONTROLLER WITH FLASH CARD DECK
    async createDeck(deckData: Partial<FlashcardDeck>) {
        const FCDeck = await this.flashdeckRepository.create(deckData)
        return this.flashdeckRepository.save(FCDeck)
    }

    async getAllDeck() {
        return await this.flashdeckRepository.find()
    }

    async getDeckbyId(deckId: number) {
        return await this.flashdeckRepository.find({
            where: { id: deckId }
        })
    }

    async updateDeck(deckData: Partial<FlashcardDeck>, deckId: number) {
        const deck = await this.flashdeckRepository.findOne({
            where: { id: deckId }
        });
        if (!deck) {
            return null;
        }
        // copy tu deckData vao deck
        // gan tu phai qua trai
        Object.assign(deck, deckData)
        // sau khi copy xong cần phải luu
        return await this.flashdeckRepository.save(deck)
    }

    async deleteDeck(deckId: number) {
        return this.flashdeckRepository.delete(deckId)
    }


    // CONTROLLER WITH FLASH CARD

    async getAllflashcard(deckId: number) {
        return await this.flashdeckRepository.find({
            where: { id: deckId },
            relations: ["flashcards"]
        })
    }

    async createflashcard(flashcardData: Partial<Flashcard>) {
        const flashcard = await this.flashRepository.create(flashcardData)
        return this.flashRepository.save(flashcard)
    }

    async updateflashcard(cardId: number, flashcardData: Partial<Flashcard>) {
        const flashcard = await this.flashRepository.findOne({
            where: { id: cardId }
        })

        Object.assign(flashcard, flashcardData)
        return await this.flashRepository.save(flashcard)
    }

    async deleteCard(cardId: number) {
        return this.flashdeckRepository.delete(cardId)
    }


}
