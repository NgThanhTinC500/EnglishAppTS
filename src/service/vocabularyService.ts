import { AppDataSource } from "../data-source";
import { VocabularySet } from "../entity/VocabularySet";
import { Vocabulary } from "../entity/Vocabulary";
import { AppError } from "../utils/appError";
export class VocabularyService {
    private vocabularySetRepository = AppDataSource.getRepository(VocabularySet);

    private vocabularyRepository = AppDataSource.getRepository(Vocabulary);

    private async findVocabularySetOrFail(
        userId: string,
        setId: number,
        relations?: { vocabularies?: boolean }
    ) {
        const vocabularySet = await this.vocabularySetRepository.findOne({
            where: { id: setId, userId },
            relations,
        });

        if (!vocabularySet) {
            throw new AppError("Vocabulary bộ không tồn tại", 404);
        }

        return vocabularySet;
    }

    private async findVocabularyOrFail(
        userId: string,
        setId: number,
        vocabularyId: number
    ) {
        await this.findVocabularySetOrFail(userId, setId);

        const vocabulary = await this.vocabularyRepository.findOne({
            where: {
                id: vocabularyId,
                vocabSetId: setId,
            },
        });

        if (!vocabulary) {
            throw new AppError("Vocabulary không tồn tại", 404);
        }

        return vocabulary;
    }

    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

    /*
        =========================
        VOCABULARY SET
        =========================
    */

    async createVocabularySet(userId: string, data: Partial<VocabularySet>) {
        if (!data.name?.trim()) {
            throw new AppError("Set name is required", 400);
        }

        const vocabularySet = this.vocabularySetRepository.create({
            name: data.name.trim(),
            tag: data.tag?.trim() || null,
            userId,
        });

        return this.vocabularySetRepository.save(vocabularySet);
    }

    async getAllVocabularySets(userId: string) {
        return this.vocabularySetRepository
            .createQueryBuilder("vocabularySet")
            .loadRelationCountAndMap(
                "vocabularySet.vocabularyCount",
                "vocabularySet.vocabularies"
            )
            .where("vocabularySet.userId = :userId", { userId })
            .orderBy("vocabularySet.createdAt", "DESC")
            .getMany();
    }

    async getVocabularySetById(userId: string, setId: number) {
        return this.findVocabularySetOrFail(userId, setId, {
            vocabularies: true,
        });
    }

    async updateVocabularySet(
        userId: string,
        setId: number,
        data: Partial<VocabularySet>
    ) {
        const vocabularySet = await this.findVocabularySetOrFail(userId, setId);

        if (data.name !== undefined && !data.name.trim()) {
            throw new AppError("Set name cannot be empty", 400);
        }

        Object.assign(vocabularySet, {
            name: data.name?.trim() ?? vocabularySet.name,
            tag: data.tag === undefined ? vocabularySet.tag : data.tag?.trim() || null,
        });

        return this.vocabularySetRepository.save(vocabularySet);
    }

    async deleteVocabularySet(userId: string, setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(userId, setId);
        await this.vocabularySetRepository.remove(vocabularySet);
    }

    /*
        =========================
        VOCABULARY
        =========================
    */

    async getVocabulariesBySetId(userId: string, setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(userId, setId, {
            vocabularies: true,
        });
        return vocabularySet.vocabularies;
    }

    async getVocabularyPracticeItems(userId: string, setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(userId, setId, {
            vocabularies: true,
        });

        return vocabularySet.vocabularies.map((vocabulary) => ({
            id: vocabulary.id,
            prompt: vocabulary.meaning,
            example: vocabulary.example,
        }));
    }

    async checkVocabularyPracticeAnswer(
        userId: string,
        vocabularyId: number,
        answerText: string
    ) {
        if (!answerText.trim()) {
            throw new AppError("answerText is required", 400);
        }

        const vocabulary = await this.vocabularyRepository.findOne({
            where: {
                id: vocabularyId,
                vocabularySet: {
                    userId,
                },
            },
            relations: {
                vocabularySet: true,
            },
        });

        if (!vocabulary) {
            throw new AppError("Vocabulary không tồn tại", 404);
        }

        const isCorrect =
            this.normalizeAnswer(answerText) === this.normalizeAnswer(vocabulary.word);

        return {
            vocabularyId: vocabulary.id,
            answerText,
            isCorrect,
            correctAnswer: vocabulary.word,
            meaning: vocabulary.meaning,
            example: vocabulary.example,
        };
    }

    async createVocabulary(
        userId: string,
        setId: number,
        data: Partial<Vocabulary>
    ) {
        await this.findVocabularySetOrFail(userId, setId);

        if (!data.word?.trim()) {
            throw new AppError("Word is required", 400);
        }

        if (!data.meaning?.trim()) {
            throw new AppError("Meaning is required", 400);
        }

        const vocabulary = this.vocabularyRepository.create({
            vocabSetId: setId,
            word: data.word.trim(),
            meaning: data.meaning.trim(),
            pronunciation: data.pronunciation?.trim() || null,
            example: data.example?.trim() || null,
        });

        return this.vocabularyRepository.save(vocabulary);
    }

    async getVocabularyDetail(
        userId: string,
        setId: number,
        vocabularyId: number
    ) {
        return this.findVocabularyOrFail(userId, setId, vocabularyId);
    }

    async updateVocabulary(
        userId: string,
        setId: number,
        vocabularyId: number,
        data: Partial<Vocabulary>
    ) {
        const vocabulary = await this.findVocabularyOrFail(
            userId,
            setId,
            vocabularyId
        );

        if (data.word !== undefined && !data.word.trim()) {
            throw new AppError("Word cannot be empty", 400);
        }

        if (data.meaning !== undefined && !data.meaning.trim()) {
            throw new AppError("Meaning cannot be empty", 400);
        }

        Object.assign(vocabulary, {
            word: data.word?.trim() ?? vocabulary.word,
            meaning: data.meaning?.trim() ?? vocabulary.meaning,
            pronunciation:
                data.pronunciation === undefined
                    ? vocabulary.pronunciation
                    : data.pronunciation?.trim() || null,
            example: data.example === undefined ? vocabulary.example : data.example?.trim() || null,
        });

        return this.vocabularyRepository.save(vocabulary);
    }

    async deleteVocabulary(
        userId: string,
        setId: number,
        vocabularyId: number
    ) {
        const vocabulary = await this.findVocabularyOrFail(
            userId,
            setId,
            vocabularyId
        );
        await this.vocabularyRepository.remove(vocabulary);
    }
}
