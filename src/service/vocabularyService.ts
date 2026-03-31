import { AppDataSource } from "../data-source";

import { VocabularySet } from "../entity/VocabularySet";
import { Vocabulary } from "../entity/Vocabulary";

export class VocabularyService {
    private vocabSetRepository = AppDataSource.getRepository(VocabularySet)
    private vocabRepository = AppDataSource.getRepository(Vocabulary)

    // CONTROLLER WITH FLASH CARD DECK
    async createVocabSets(deckData: Partial<VocabularySet>) {
        const flashcardDeck = this.vocabSetRepository.create(deckData)
        return this.vocabSetRepository.save(flashcardDeck)
    }

    async getAllVocabSets(userId: string) {
        return await this.vocabSetRepository.find({
            where: { userId }
        })
    }
    async getVocabSetById(vocabsetsId: number) {
        return await this.vocabSetRepository.findOne({
            where: { id: vocabsetsId }
        })
    }

    async updateVocabSets(deckData: Partial<VocabularySet>, vocabsetsId: number) {
        const deck = await this.vocabSetRepository.findOne({
            where: { id: vocabsetsId }
        });
        if (!deck) {
            return null;
        }
        // copy tu deckData vao deck
        // gan tu phai qua trai
        Object.assign(deck, deckData)
        // sau khi copy xong cần phải luu
        return await this.vocabSetRepository.save(deck)
    }

    async deleteVocabSets(vocabsetsId: number) {
        return this.vocabSetRepository.delete(vocabsetsId)
    }


    // CONTROLLER WITH FLASH CARD

    async getAllVocab(vocabsetsId: number) {
        return await this.vocabSetRepository.findOne({
            where: { id: vocabsetsId },
            relations: {
                vocabularies: true
            }
        })
    }

    async createVocabCard(vocabsetsId: number, flashcardData: Partial<Vocabulary>) {
        const { word, meaning } = flashcardData;
        const flashcard = this.vocabRepository.create({
            vocabSetId: vocabsetsId, word, meaning
        })
        return this.vocabRepository.save(flashcard)
    }

    async updateVocabCard(cardId: number, flashcardData: Partial<Vocabulary>) {
        const flashcard = await this.vocabRepository.findOne({
            where: { id: cardId }
        })

        Object.assign(flashcard, flashcardData)
        return await this.vocabRepository.save(flashcard)
    }

    async deleteVocabCard(cardId: number) {
        return this.vocabRepository.delete(cardId)
    }

    async getVocabCardDetail(vocabsetsId: number, cardId: number) {
        return await this.vocabRepository.findOne({
            where: { id: cardId, vocabSetId: vocabsetsId }
        })
    }

}
