import { AppError } from "../utils/appError";
import { TranslationService } from "./translationService";

type DictionaryPhonetic = {
    text?: string;
    audio?: string;
};

type DictionaryMeaning = {
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

export class VocabularyLookupService {
    constructor(
        private readonly translationService = new TranslationService()
    ) {}

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

    // tìm kiếm từ vựng trên dictionaryapi.dev, nếu có lỗi hoặc không tìm thấy sẽ trả về lỗi tương ứng
    async lookupVocabulary(wordValue: string) {
        const word = wordValue.trim();
        if (!word) {
            throw new AppError("Phải nhập từ cần tìm kiếm", 400);
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
            throw new AppError("Không thể fetch dữ liệu từ điển bây giờ", 502);
        } finally {
            clearTimeout(timeout);
        }

        if (response.status === 404) {
            throw new AppError("Không tìm thấy dữ liệu từ điển cho từ này", 404);
        }

        if (!response.ok) {
            throw new AppError("Không thể fetch dữ liệu từ điển bây giờ", 502);
        }

        const entries = (await response.json()) as DictionaryEntry[];
        const entry = entries[0];
        if (!entry) {
            throw new AppError("Không tìm thấy dữ liệu từ điển cho từ này", 404);
        }

        const dictionaryDefinition = this.pickDictionaryDefinition(entry);
        const exampleEn = this.pickDictionaryExample(entry);
        const translatedWord = await this.translationService.translateTextToVietnamese(word);
        const translatedDefinition =
            translatedWord ??
            (dictionaryDefinition
                ? await this.translationService.translateTextToVietnamese(dictionaryDefinition)
                : null);
        const translatedMeaning = translatedDefinition?.text ?? null;
        const exampleVi = await this.translationService.translateTextToVietnamese(exampleEn);
        const audioUsUrl = this.pickDictionaryAudioByDialect(entry.phonetics, "us");
        const audioUkUrl = this.pickDictionaryAudioByDialect(entry.phonetics, "uk");
        const pronunciation = this.pickDictionaryPronunciation(entry);

        return {
            word: entry.word || word,
            meaningVi: translatedMeaning ?? dictionaryDefinition,
            phonetic: pronunciation,
            audioUrl: audioUsUrl ?? audioUkUrl ?? this.pickDictionaryAudio(entry.phonetics),
            audioUsUrl,
            audioUkUrl,
            exampleEn,
            exampleVi: exampleVi?.text ?? null,
        };
    }
}
