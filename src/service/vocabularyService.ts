import { AppDataSource } from "../data-source";
import { UserRole } from "../entity/User";
import { Vocabulary } from "../entity/Vocabulary";
import { VocabularySet } from "../entity/VocabularySet";
import { AppError } from "../utils/appError";

export class VocabularyService {
    private vocabularySetRepository = AppDataSource.getRepository(VocabularySet);

    private vocabularyRepository = AppDataSource.getRepository(Vocabulary);


    // kiểm tra xem bộ từ vựng có tồn tại hay không, nếu không tồn tại thì ném ra lỗi
    private async findVocabularySetOrFail(
        setId: number,
        relations?: { vocabularies?: boolean }
    ) {
        const vocabularySet = await this.vocabularySetRepository.findOne({
            where: {
                id: setId,
                user: {
                    role: UserRole.ADMIN,
                },
            },
            relations,
        });

        if (!vocabularySet) {
            throw new AppError("Vocabulary set không tồn tại", 404);
        }

        return vocabularySet;
    }

    private async findVocabularyOrFail(setId: number, vocabularyId: number) {
        await this.findVocabularySetOrFail(setId);

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

    private normalizeNullableText(value: string | null | undefined) {
        return value?.trim() || null;
    }

    async createVocabularySet(userId: string, data: Partial<VocabularySet>) {
        const vocabularySet = this.vocabularySetRepository.create({
            name: data.name!.trim(),
            tag: data.tag!.trim(),
            userId,
        });

        return this.vocabularySetRepository.save(vocabularySet);
    }

    async getAllVocabularySets() {
        return this.vocabularySetRepository.query(
            `
                SELECT
                    vs.*,
                    COUNT(v.id)::int AS "vocabularyCount"
                FROM vocabulary_sets AS vs
                INNER JOIN "user" AS owner
                    ON owner.id = vs."userId"
                LEFT JOIN vocabulary AS v
                    ON v."vocabSetId" = vs.id
                WHERE owner.role = $1
                GROUP BY vs.id
                ORDER BY vs."createdAt" DESC
            `,
            [UserRole.ADMIN]
        );
    }

    async getVocabularySetById(setId: number) {
        return this.findVocabularySetOrFail(setId, {
            vocabularies: true,
        });
    }

    async updateVocabularySet(
        setId: number,
        data: Partial<VocabularySet>
    ) {
        const vocabularySet = await this.findVocabularySetOrFail(setId);

        if (data.name !== undefined && !data.name.trim()) {
            throw new AppError("Phải có tên bộ từ vựng", 400);
        }

        if (data.tag !== undefined && !data.tag.trim()) {
            throw new AppError("Phải có tag cho bộ từ vựng", 400);
        }

        if (data.name !== undefined) {
            vocabularySet.name = data.name.trim();
        }

        if (data.tag !== undefined) {
            vocabularySet.tag = data.tag.trim();
        }

        return this.vocabularySetRepository.save(vocabularySet);
    }

    async deleteVocabularySet(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId);
        await this.vocabularySetRepository.remove(vocabularySet);
    }

    // trả về danh sách vocabularies trong bộ từ vựng
    async getVocabulariesBySetId(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId, {
            vocabularies: true,
        });
        return vocabularySet.vocabularies;
    }

    async createVocabulary(
        setId: number,
        data: Partial<Vocabulary>
    ) {
        await this.findVocabularySetOrFail(setId);

        if (!data.word?.trim()) {
            throw new AppError("Phải nhập từ cần thêm", 400);
        }

        if (!data.meaning?.trim()) {
            throw new AppError("Meaning is required", 400);
        }

        const vocabulary = this.vocabularyRepository.create({
            vocabSetId: setId,
            word: data.word.trim(),
            meaning: data.meaning.trim(),
            pronunciation: this.normalizeNullableText(data.pronunciation),
            audioUrl: this.normalizeNullableText(data.audioUrl),
            audioUsUrl: this.normalizeNullableText(data.audioUsUrl),
            audioUkUrl: this.normalizeNullableText(data.audioUkUrl),
            example: this.normalizeNullableText(data.example),
            exampleVi: this.normalizeNullableText(data.exampleVi),
        });

        return this.vocabularyRepository.save(vocabulary);
    }

    async getVocabularyDetail(
        setId: number,
        vocabularyId: number
    ) {
        return this.findVocabularyOrFail(setId, vocabularyId);
    }

    async updateVocabulary(
        setId: number,
        vocabularyId: number,
        data: Partial<Vocabulary>
    ) {
        const vocabulary = await this.findVocabularyOrFail(setId, vocabularyId);

        if (data.word !== undefined && !data.word.trim()) {
            throw new AppError("Phải nhập từ cần cập nhật", 400);
        }

        if (data.meaning !== undefined && !data.meaning.trim()) {
            throw new AppError("Phải nhập nghĩa của từ", 400);
        }

        Object.assign(vocabulary, {
            word: data.word?.trim() ?? vocabulary.word,
            meaning: data.meaning?.trim() ?? vocabulary.meaning,
            pronunciation:
                data.pronunciation === undefined
                    ? vocabulary.pronunciation
                    : this.normalizeNullableText(data.pronunciation),
            audioUrl:
                data.audioUrl === undefined
                    ? vocabulary.audioUrl
                    : this.normalizeNullableText(data.audioUrl),
            audioUsUrl:
                data.audioUsUrl === undefined
                    ? vocabulary.audioUsUrl
                    : this.normalizeNullableText(data.audioUsUrl),
            audioUkUrl:
                data.audioUkUrl === undefined
                    ? vocabulary.audioUkUrl
                    : this.normalizeNullableText(data.audioUkUrl),
            example:
                data.example === undefined
                    ? vocabulary.example
                    : this.normalizeNullableText(data.example),
            exampleVi:
                data.exampleVi === undefined
                    ? vocabulary.exampleVi
                    : this.normalizeNullableText(data.exampleVi),
        });

        return this.vocabularyRepository.save(vocabulary);
    }

    async deleteVocabulary(
        setId: number,
        vocabularyId: number
    ) {
        const vocabulary = await this.findVocabularyOrFail(setId, vocabularyId);
        await this.vocabularyRepository.remove(vocabulary);
    }
}
