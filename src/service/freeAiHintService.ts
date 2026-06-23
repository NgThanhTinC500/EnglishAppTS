type AnswerHintInput = {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    baseExplanation?: string | null;
};

const DEFAULT_HINT_API_URL = "https://text.pollinations.ai";
const DEFAULT_TIMEOUT_MS = 3500;

function normalizeHint(value: string) {
    return value
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 700);
}

function buildPrompt(input: AnswerHintInput) {
    return [
        "Hay tra loi bang tieng Viet, ngan gon, khong markdown.",
        "Giai thich cau truc ngu phap TOEIC cua cau hoi.",
        "Neu nguoi hoc chon sai, noi ro vi sao sai va nen on tap muc nao.",
        "Gioi han 2-3 cau.",
        `Cau hoi: ${input.question}`,
        `Dap an nguoi hoc chon: ${input.selectedAnswer}`,
        `Dap an dung: ${input.correctAnswer}`,
        input.baseExplanation ? `Giai thich co san: ${input.baseExplanation}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

export class FreeAiHintService {
    private readonly apiUrl = process.env.AI_HINT_API_URL || DEFAULT_HINT_API_URL;
    private readonly enabled = process.env.AI_HINTS_ENABLED !== "false";
    private readonly timeoutMs = Number(process.env.AI_HINT_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

    async generateWrongAnswerHint(input: AnswerHintInput) {
        if (!this.enabled) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const prompt = buildPrompt(input);
            const url = `${this.apiUrl.replace(/\/$/, "")}/${encodeURIComponent(prompt)}`;
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    accept: "text/plain",
                },
            });

            if (!response.ok) return null;

            const text = normalizeHint(await response.text());
            return text || null;
        } catch (_error) {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }
}
