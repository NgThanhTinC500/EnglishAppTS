type GoogleTranslateResponse = {
    data?: {
        translations?: {
            translatedText?: string;
        }[];
    };
};

export class TranslationService {
    private normalizeNullableText(value: string | null | undefined) {
        return value?.trim() || null;
    }

    private getConfiguredEnvValue(name: string) {
        const value = process.env[name]?.trim();
        if (!value) return null;

        const lowerValue = value.toLowerCase();
        if (
            lowerValue === "your_key" ||
            lowerValue === "your_region" ||
            lowerValue === "your_speech_key"
        ) {
            return null;
        }

        return value;
    }

    async translateTextToVietnamese(text: string | null) {
        if (!text) return null;

        const googleTranslation = await this.translateTextWithGoogle(text);
        if (googleTranslation) {
            return {
                text: googleTranslation,
                source: "Google Translate API",
            };
        }

        return null;
    }

    // dịch văn bản sang tiếng Việt bằng Google Translate API, nếu có lỗi hoặc không tìm thấy sẽ trả về null 
    private async translateTextWithGoogle(text: string) {
        const key = this.getConfiguredEnvValue("GOOGLE_TRANSLATE_API_KEY");
        if (!key) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
            const response = await fetch(
                `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        q: text,
                        source: "en",
                        target: "vi",
                        format: "text",
                    }),
                    signal: controller.signal,
                }
            );

            if (!response.ok) return null;

            const result = (await response.json()) as GoogleTranslateResponse;
            return this.normalizeNullableText(
                result.data?.translations?.[0]?.translatedText
            );
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

}
