import { AppDataSource } from "../data-source";
import { VocabularySet } from "../entity/VocabularySet";
import { Vocabulary } from "../entity/Vocabulary";
import { AppError } from "../utils/appError";
import { UserRole } from "../entity/User";
import {
    UserVocabularyProgress,
    VocabularyProgressStatus,
} from "../entity/UserVocabularyProgress";
import {
    VocabularyPracticeSession,
} from "../entity/VocabularyPracticeSession";
import {
    VocabularyPracticeAnswer,
} from "../entity/VocabularyPracticeAnswer";
import {
    VocabularyPracticeMode,
    VocabularyPracticeResult,
} from "../entity/VocabularyPracticeEnums";

type DictionaryPhonetic = {
    text?: string;
    audio?: string;
};

type DictionaryMeaning = {
    partOfSpeech?: string;
    definitions?: {
        definition?: string;
        example?: string;
    }[];
};

type DictionaryEntry = {
    word?: string;
    phonetic?: string;
    phonetics?: DictionaryPhonetic[];
    meanings?: DictionaryMeaning[];
};

type MyMemoryTranslateResponse = {
    responseData?: {
        translatedText?: string;
    };
};

export class VocabularyService {
    private vocabularySetRepository = AppDataSource.getRepository(VocabularySet);

    private vocabularyRepository = AppDataSource.getRepository(Vocabulary);

    private progressRepository = AppDataSource.getRepository(UserVocabularyProgress);

    private sessionRepository = AppDataSource.getRepository(VocabularyPracticeSession);

    private practiceAnswerRepository = AppDataSource.getRepository(VocabularyPracticeAnswer);

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
            throw new AppError("Vocabulary bộ không tồn tại", 404);
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

    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

    private normalizeNullableText(value: string | null | undefined) {
        return value?.trim() || null;
    }

    private normalizeDictionaryAudioUrl(value: string | undefined) {
        const audioUrl = value?.trim();
        if (!audioUrl) return null;

        if (audioUrl.startsWith("//")) {
            return `https:${audioUrl}`;
        }

        return audioUrl;
    }

    private audioUrlMatchesDialect(audioUrl: string | undefined, dialect: "us" | "uk") {
        const normalized = audioUrl?.toLowerCase() ?? "";
        if (!normalized) return false;

        if (dialect === "us") {
            return /(^|[-_/])us([-_.]|$)|(^|[-_/])usa([-_.]|$)/.test(normalized);
        }

        return /(^|[-_/])uk([-_.]|$)|(^|[-_/])gb([-_.]|$)|(^|[-_/])br([-_.]|$)/.test(normalized);
    }

    private pickDictionaryAudioByDialect(
        phonetics: DictionaryPhonetic[] = [],
        dialect: "us" | "uk"
    ) {
        const withAudio = phonetics.find((item) =>
            this.audioUrlMatchesDialect(item.audio, dialect)
        );

        return this.normalizeDictionaryAudioUrl(withAudio?.audio);
    }

    private pickDictionaryAudio(phonetics: DictionaryPhonetic[] = []) {
        return (
            this.pickDictionaryAudioByDialect(phonetics, "us") ??
            this.pickDictionaryAudioByDialect(phonetics, "uk") ??
            this.normalizeDictionaryAudioUrl(
                phonetics.find((item) => item.audio?.trim())?.audio
            )
        );
    }

    private pickDictionaryPronunciation(entry: DictionaryEntry) {
        const phoneticText =
            entry.phonetics?.find((item) => item.text?.trim())?.text ??
            entry.phonetic;

        return this.normalizeNullableText(phoneticText);
    }

    private pickDictionaryExample(entry: DictionaryEntry) {
        for (const meaning of entry.meanings ?? []) {
            const example = meaning.definitions?.find((item) => item.example?.trim())?.example;
            if (example) return example.trim();
        }

        return null;
    }

    private pickDictionaryDefinition(entry: DictionaryEntry) {
        for (const meaning of entry.meanings ?? []) {
            const definition = meaning.definitions?.find((item) => item.definition?.trim())?.definition;
            if (definition) return definition.trim();
        }

        return null;
    }

    private async translateTextToVietnamese(text: string | null) {
        if (!text) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                }
            );

            if (!response.ok) return null;

            const result = (await response.json()) as MyMemoryTranslateResponse;
            return this.normalizeNullableText(result.responseData?.translatedText);
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    private ensurePracticeMode(mode: string) {
        if (!Object.values(VocabularyPracticeMode).includes(mode as VocabularyPracticeMode)) {
            throw new AppError("Invalid vocabulary practice mode", 400);
        }

        return mode as VocabularyPracticeMode;
    }

    private async findUserSessionOrFail(sessionId: number, userId: string) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new AppError("Vocabulary practice session not found", 404);
        }

        return session;
    }

    private async findVocabularyForPracticeOrFail(vocabularyId: number) {
        const vocabulary = await this.vocabularyRepository.findOne({
            where: {
                id: vocabularyId,
                vocabularySet: {
                    user: {
                        role: UserRole.ADMIN,
                    },
                },
            },
            relations: {
                vocabularySet: {
                    user: true,
                },
            },
        });

        if (!vocabulary) {
            throw new AppError("Vocabulary không tồn tại", 404);
        }

        return vocabulary;
    }

    private getNextReviewDate(status: VocabularyProgressStatus) {
        const nextReviewAt = new Date();

        if (status === VocabularyProgressStatus.MASTERED) {
            nextReviewAt.setDate(nextReviewAt.getDate() + 7);
            return nextReviewAt;
        }

        nextReviewAt.setDate(nextReviewAt.getDate() + 1);
        return nextReviewAt;
    }

    private getProgressStatusFromResult(result: VocabularyPracticeResult) {
        if (result === VocabularyPracticeResult.CORRECT) {
            return VocabularyProgressStatus.MASTERED;
        }

        if (result === VocabularyPracticeResult.WRONG) {
            return VocabularyProgressStatus.REVIEW;
        }

        return VocabularyProgressStatus.LEARNING;
    }

    private async updateVocabularyProgress(
        userId: string,
        vocabulary: Vocabulary,
        result: VocabularyPracticeResult,
        practicedAt: Date
    ) {
        let progress = await this.progressRepository.findOne({
            where: { userId, vocabularyId: vocabulary.id },
        });

        if (!progress) {
            progress = this.progressRepository.create({
                userId,
                vocabularyId: vocabulary.id,
                vocabSetId: vocabulary.vocabSetId,
                status: VocabularyProgressStatus.LEARNING,
                flashcardSeenCount: 0,
                flashcardRememberedCount: 0,
                flashcardForgotCount: 0,
                spellingCorrectCount: 0,
                spellingWrongCount: 0,
                lastPracticedAt: practicedAt,
            });
        }

        progress.flashcardSeenCount = progress.flashcardSeenCount ?? 0;
        progress.flashcardRememberedCount = progress.flashcardRememberedCount ?? 0;
        progress.flashcardForgotCount = progress.flashcardForgotCount ?? 0;
        progress.spellingCorrectCount = progress.spellingCorrectCount ?? 0;
        progress.spellingWrongCount = progress.spellingWrongCount ?? 0;

        if (result === VocabularyPracticeResult.CORRECT) {
            progress.spellingCorrectCount += 1;
        }

        if (result === VocabularyPracticeResult.WRONG) {
            progress.spellingWrongCount += 1;
        }

        progress.status = this.getProgressStatusFromResult(result);
        progress.lastPracticedAt = practicedAt;
        progress.nextReviewAt = this.getNextReviewDate(progress.status);

        return this.progressRepository.save(progress);
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

    async getAllVocabularySets() {
        return this.vocabularySetRepository
            .createQueryBuilder("vocabularySet")
            .loadRelationCountAndMap(
                "vocabularySet.vocabularyCount",
                "vocabularySet.vocabularies"
            )
            .innerJoin("vocabularySet.user", "owner", "owner.role = :role", {
                role: UserRole.ADMIN,
            })
            .orderBy("vocabularySet.createdAt", "DESC")
            .getMany();
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
            throw new AppError("Set name cannot be empty", 400);
        }

        Object.assign(vocabularySet, {
            name: data.name?.trim() ?? vocabularySet.name,
            tag: data.tag === undefined ? vocabularySet.tag : data.tag?.trim() || null,
        });

        return this.vocabularySetRepository.save(vocabularySet);
    }

    async deleteVocabularySet(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId);
        await this.vocabularySetRepository.remove(vocabularySet);
    }

    /*
        =========================
        VOCABULARY
        =========================
    */

    async getVocabulariesBySetId(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId, {
            vocabularies: true,
        });
        return vocabularySet.vocabularies;
    }

    async getVocabularyPracticeItems(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId, {
            vocabularies: true,
        });

        return vocabularySet.vocabularies.map((vocabulary) => ({
            id: vocabulary.id,
            prompt: vocabulary.meaning,
            example: vocabulary.example,
        }));
    }

    async checkVocabularyPracticeAnswer(
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
                    user: {
                        role: UserRole.ADMIN,
                    },
                },
            },
            relations: {
                vocabularySet: {
                    user: true,
                },
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

    async lookupVocabulary(wordValue: string) {
        const word = wordValue.trim();
        if (!word) {
            throw new AppError("Word is required", 400);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        let response: Response;

        try {
            response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                }
            );
        } catch {
            throw new AppError("Cannot fetch dictionary data right now", 502);
        } finally {
            clearTimeout(timeout);
        }

        if (response.status === 404) {
            throw new AppError("Dictionary data not found for this word", 404);
        }

        if (!response.ok) {
            throw new AppError("Cannot fetch dictionary data right now", 502);
        }

        const entries = (await response.json()) as DictionaryEntry[];
        const entry = entries[0];
        if (!entry) {
            throw new AppError("Dictionary data not found for this word", 404);
        }

        const firstMeaning = entry.meanings?.[0];
        const definitionEn = this.pickDictionaryDefinition(entry);
        const translatedMeaning = await this.translateTextToVietnamese(definitionEn);
        const audioUsUrl = this.pickDictionaryAudioByDialect(entry.phonetics, "us");
        const audioUkUrl = this.pickDictionaryAudioByDialect(entry.phonetics, "uk");

        return {
            word: entry.word || word,
            pronunciation: this.pickDictionaryPronunciation(entry),
            partOfSpeech: this.normalizeNullableText(firstMeaning?.partOfSpeech),
            audioUrl: audioUsUrl ?? audioUkUrl ?? this.pickDictionaryAudio(entry.phonetics),
            audioUsUrl,
            audioUkUrl,
            meaning: translatedMeaning ?? definitionEn,
            definitionEn,
            example: this.pickDictionaryExample(entry),
            source: "dictionaryapi.dev",
            translationSource: translatedMeaning ? "mymemory.translated.net" : null,
        };
    }

    async startPracticeSession(
        userId: string,
        vocabSetId: number,
        modeValue: string
    ) {
        await this.findVocabularySetOrFail(vocabSetId);

        const mode = this.ensurePracticeMode(modeValue);

        return this.sessionRepository.save(
            this.sessionRepository.create({
                userId,
                vocabSetId,
                mode,
                startedAt: new Date(),
            })
        );
    }

    async submitSpellingAnswer(
        userId: string,
        sessionId: number,
        vocabularyId: number,
        answerText: string
    ) {
        if (!answerText.trim()) {
            throw new AppError("answerText is required", 400);
        }

        const session = await this.findUserSessionOrFail(sessionId, userId);
        if (session.mode !== VocabularyPracticeMode.SPELLING) {
            throw new AppError("Session is not a spelling session", 400);
        }

        const vocabulary = await this.findVocabularyForPracticeOrFail(vocabularyId);
        if (vocabulary.vocabSetId !== session.vocabSetId) {
            throw new AppError("Vocabulary does not belong to this session set", 400);
        }

        const isCorrect =
            this.normalizeAnswer(answerText) === this.normalizeAnswer(vocabulary.word);
        const result = isCorrect
            ? VocabularyPracticeResult.CORRECT
            : VocabularyPracticeResult.WRONG;
        const answeredAt = new Date();

        const answer = await this.practiceAnswerRepository.save(
            this.practiceAnswerRepository.create({
                sessionId,
                userId,
                vocabularyId,
                mode: VocabularyPracticeMode.SPELLING,
                result,
                answerText,
                answeredAt,
            })
        );

        session.correctCount = session.correctCount ?? 0;
        session.wrongCount = session.wrongCount ?? 0;
        if (isCorrect) {
            session.correctCount += 1;
        } else {
            session.wrongCount += 1;
        }
        session.endedAt = answeredAt;
        await this.sessionRepository.save(session);

        const progress = await this.updateVocabularyProgress(
            userId,
            vocabulary,
            result,
            answeredAt
        );

        return {
            answer,
            session,
            progress,
            vocabularyId: vocabulary.id,
            answerText,
            isCorrect,
            correctAnswer: vocabulary.word,
            meaning: vocabulary.meaning,
            example: vocabulary.example,
        };
    }

    async createVocabulary(
        setId: number,
        data: Partial<Vocabulary>
    ) {
        await this.findVocabularySetOrFail(setId);

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
            definitionEn: this.normalizeNullableText(data.definitionEn),
            pronunciation: this.normalizeNullableText(data.pronunciation),
            partOfSpeech: this.normalizeNullableText(data.partOfSpeech),
            audioUrl: this.normalizeNullableText(data.audioUrl),
            audioUsUrl: this.normalizeNullableText(data.audioUsUrl),
            audioUkUrl: this.normalizeNullableText(data.audioUkUrl),
            example: this.normalizeNullableText(data.example),
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
            throw new AppError("Word cannot be empty", 400);
        }

        if (data.meaning !== undefined && !data.meaning.trim()) {
            throw new AppError("Meaning cannot be empty", 400);
        }

        Object.assign(vocabulary, {
            word: data.word?.trim() ?? vocabulary.word,
            meaning: data.meaning?.trim() ?? vocabulary.meaning,
            definitionEn:
                data.definitionEn === undefined
                    ? vocabulary.definitionEn
                    : this.normalizeNullableText(data.definitionEn),
            pronunciation:
                data.pronunciation === undefined
                    ? vocabulary.pronunciation
                    : this.normalizeNullableText(data.pronunciation),
            partOfSpeech:
                data.partOfSpeech === undefined
                    ? vocabulary.partOfSpeech
                    : this.normalizeNullableText(data.partOfSpeech),
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
