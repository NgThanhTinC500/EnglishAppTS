import { AppError } from "../utils/appError";

type ChatRole = "user" | "assistant" | "system";

export interface EnglishChatMessage {
  role: ChatRole;
  content: string;
}

export interface AnswerExplanationInput {
  questionContent: string | null;
  category?: string | null;
  transcript?: string | null;
  selectedOption: {
    label: string;
    content: string;
  };
  correctOption: {
    label: string;
    content: string;
  };
  options: Array<{
    label: string;
    content: string;
    isCorrect?: boolean;
  }>;
  existingExplanation?: string | null;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    text?: string;
  }>;
  text?: string;
  content?: string;
  answer?: string;
}

const DEFAULT_AI_HINT_API_URL = "https://text.pollinations.ai";
const DEFAULT_POLLINATIONS_MODEL = "openai";
const DEFAULT_LOCAL_MODEL = "local-gguf";
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 8;
const DEFAULT_TIMEOUT_MS = 60000;

const TOPIC_WARNING =
  "Mình chỉ trả lời các câu hỏi về tiếng Anh: ngữ pháp, từ vựng, phát âm, dịch thuật, luyện nói/viết, TOEIC/IELTS và bài tập tiếng Anh.";

const englishTopicPattern =
  /\b(english|grammar|vocabulary|vocab|word|phrase|sentence|meaning|pronunciation|pronounce|ipa|tense|verb|noun|adjective|adverb|preposition|article|clause|idiom|synonym|antonym|toeic|ielts|writing|speaking|listening|reading|essay|translate|translation|collocation|phrasal|past|present|future|perfect|continuous|plural|singular|compare|difference|usage|example|exercise|question|quiz|answer|option)\b/i;

const vietnameseEnglishTopicPattern =
  /\b(tieng anh|anh van|ngu phap|tu vung|dich|nghia|phat am|ipa|cau|dat cau|dat cau hoi|hoi dap|thi|dong tu|danh tu|tinh tu|trang tu|gioi tu|mao tu|cum tu|thanh ngu|vi du|so sanh|cach dung|bai nghe|luyen nghe|luyen noi|luyen viet|sua loi|sua ngu phap|cham bai|bai tap|dap an|toeic|ielts)\b/i;

const offTopicPattern =
  /\b(weather|bitcoin|crypto|stock|price|football|movie|recipe|politics|news|travel|hotel|restaurant|medical|doctor|law|legal)\b/i;

const ENGLISH_TEACHER_SYSTEM_PROMPT = [
  "Bạn là AI giáo viên tiếng Anh cho website TT English.",
  "Bạn có thể hiểu và trả lời bằng tiếng Việt hoặc tiếng Anh tùy theo ngôn ngữ người học dùng.",
  "Mục tiêu là dạy dễ hiểu, thực tế, khuyến khích người học tự luyện tập.",
  "",
  "Nhiệm vụ chính:",
  "- Sửa ngữ pháp, diễn đạt tự nhiên hơn và giải thích lỗi.",
  "- Giải thích ngữ pháp, thì, cấu trúc câu và cách dùng.",
  "- Giải thích từ vựng: nghĩa, IPA, loại từ, ví dụ, collocation, synonym/antonym nếu hữu ích.",
  "- Dịch Anh-Việt và Việt-Anh. Nếu người học chỉ yêu cầu dịch, hãy dịch gọn, không lan man.",
  "- Đặt câu ví dụ, đặt câu hỏi luyện tập, tạo bài tập trắc nghiệm/tự luận khi được yêu cầu.",
  "- Hỗ trợ phát âm, IPA, TOEIC, IELTS, reading, listening, speaking và writing.",
  "- Giải thích đáp án A/B/C/D: vì sao đáp án đúng đúng, vì sao các đáp án còn lại sai.",
  "",
  "Cách trả lời:",
  "- Tự động nhận biết ý định của người học.",
  "- Nếu người học hỏi bằng tiếng Việt, trả lời chủ yếu bằng tiếng Việt, có thể kèm thuật ngữ tiếng Anh.",
  "- Nếu người học hỏi bằng tiếng Anh, trả lời bằng tiếng Anh đơn giản; nếu câu hỏi khó, có thể giải thích thêm bằng tiếng Việt.",
  "- Nếu người học chỉ gửi một câu tiếng Anh, mặc định kiểm tra ngữ pháp và gợi ý câu tự nhiên hơn.",
  "- Trả lời gọn, rõ, có ví dụ. Dùng bullet khi cần.",
  "",
  "Nếu hỏi nghĩa của từ/cụm từ, ưu tiên cấu trúc:",
  "Nghĩa: ...",
  "IPA: ...",
  "Loại từ: ...",
  "Cách dùng: ...",
  "Ví dụ: ...",
  "",
  "Không trả lời các chủ đề ngoài học tiếng Anh. Nếu người học hỏi ngoài phạm vi, nhắc nhẹ rằng bạn chỉ hỗ trợ học tiếng Anh.",
].join("\n");

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function isEnglishLearningQuestion(message: string): boolean {
  const normalizedMessage = normalizeSearchText(message);
  if (!normalizedMessage) return false;
  if (offTopicPattern.test(normalizedMessage)) return false;

  const looksLikeEnglishSentence = /[a-z]/i.test(message) && message.length <= MAX_MESSAGE_LENGTH;
  const looksLikeShortVocabularyItem =
    /^[a-z][a-z\s'-]{0,80}$/.test(normalizedMessage) &&
    normalizedMessage.split(/\s+/).length <= 6;

  return (
    englishTopicPattern.test(normalizedMessage) ||
    vietnameseEnglishTopicPattern.test(normalizedMessage) ||
    looksLikeEnglishSentence ||
    looksLikeShortVocabularyItem
  );
}

function normalizeHistory(history: unknown): EnglishChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item): item is EnglishChatMessage => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as EnglishChatMessage;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function getTimeoutMs(): number {
  const timeout = Number(process.env.AI_HINT_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0
    ? Math.max(timeout, DEFAULT_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
}

function getAiProvider() {
  return (process.env.AI_PROVIDER || "pollinations").trim().toLowerCase();
}

function isLocalProvider() {
  return ["local", "custom", "llama", "gguf"].includes(getAiProvider());
}

function getAnswer(data: ChatCompletionResponse): string {
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    data?.choices?.[0]?.text?.trim() ||
    data?.answer?.trim() ||
    data?.text?.trim() ||
    data?.content?.trim() ||
    ""
  );
}

async function parseCompletionResponse(response: Response): Promise<ChatCompletionResponse> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ChatCompletionResponse;
  }

  return { text: (await response.text()).trim() };
}

function getPollinationsBaseUrl(): string {
  return (process.env.AI_HINT_API_URL || DEFAULT_AI_HINT_API_URL)
    .replace(/\/+$/, "")
    .replace(/\/openai$/i, "");
}

function getPollinationsOpenAiUrl(): string {
  return `${getPollinationsBaseUrl()}/openai`;
}

function getLocalChatUrl(): string {
  const configuredUrl =
    process.env.AI_FINE_TUNED_API_URL ||
    process.env.LOCAL_LLM_API_URL ||
    "http://localhost:8080/v1/chat/completions";
  const trimmedUrl = configuredUrl.replace(/\/+$/, "");

  if (trimmedUrl.endsWith("/v1/chat/completions") || trimmedUrl.endsWith("/chat")) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/v1/chat/completions`;
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.AI_FINE_TUNED_API_KEY || process.env.LOCAL_LLM_API_KEY;

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

async function postChatCompletion(
  url: string,
  body: Record<string, unknown>
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new AppError(
        errorText || "Không thể gọi API chatbot lúc này.",
        response.status >= 400 && response.status < 500 ? 400 : 502
      );
    }

    const answer = getAnswer(await parseCompletionResponse(response));
    if (!answer) {
      throw new AppError("API chatbot không trả về nội dung.", 502);
    }

    return answer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Không thể gọi API chatbot lúc này.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function buildPlainPrompt(messages: EnglishChatMessage[]) {
  return messages
    .map((item) => {
      const label =
        item.role === "system"
          ? "Instruction"
          : item.role === "assistant"
            ? "Assistant"
            : "User";
      return `${label}: ${item.content}`;
    })
    .join("\n\n");
}

async function requestTextCompletionFallback(
  messages: EnglishChatMessage[]
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
  const url = new URL(
    `${getPollinationsBaseUrl()}/${encodeURIComponent(buildPlainPrompt(messages))}`
  );
  url.searchParams.set("model", process.env.AI_HINT_MODEL || DEFAULT_POLLINATIONS_MODEL);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new AppError("Không thể gọi API chatbot lúc này.", 502);
    }

    const answer = (await response.text()).trim();
    if (!answer) {
      throw new AppError("API chatbot không trả về nội dung.", 502);
    }

    return answer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Chatbot đang bận, vui lòng thử lại sau.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestPollinationsCompletion(
  messages: EnglishChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  try {
    return await postChatCompletion(getPollinationsOpenAiUrl(), {
      model: process.env.AI_HINT_MODEL || DEFAULT_POLLINATIONS_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages,
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode >= 500) {
      return requestTextCompletionFallback(messages);
    }
    throw error;
  }
}

async function requestLocalCompletion(
  messages: EnglishChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  return postChatCompletion(getLocalChatUrl(), {
    model: process.env.AI_FINE_TUNED_MODEL || DEFAULT_LOCAL_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages,
  });
}

async function requestChatCompletion(
  messages: EnglishChatMessage[],
  maxTokens = 512,
  temperature = 0.3
): Promise<string> {
  if (isLocalProvider()) {
    return requestLocalCompletion(messages, maxTokens, temperature);
  }

  return requestPollinationsCompletion(messages, maxTokens, temperature);
}

export async function generateAnswerExplanation(
  input: AnswerExplanationInput
): Promise<string> {
  if (process.env.AI_HINTS_ENABLED === "false") {
    throw new AppError("Chatbot tiếng Anh đang tắt trên hệ thống.", 503);
  }

  const optionLines = input.options
    .map((option) =>
      `${option.label}. ${option.content}${option.isCorrect ? " (correct)" : ""}`
    )
    .join("\n");

  return requestChatCompletion(
    [
      {
        role: "system",
        content: ENGLISH_TEACHER_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          "Giải thích đáp án dựa trên dữ liệu sau. Không tự đổi đáp án đúng.",
          `Loại câu hỏi: ${input.category ?? "unknown"}`,
          `Câu hỏi: ${input.questionContent ?? ""}`,
          input.transcript ? `Transcript: ${input.transcript}` : "",
          `Các lựa chọn:\n${optionLines}`,
          `Người học chọn: ${input.selectedOption.label}. ${input.selectedOption.content}`,
          `Đáp án đúng từ database: ${input.correctOption.label}. ${input.correctOption.content}`,
          input.existingExplanation
            ? `Ghi chú sẵn trong database: ${input.existingExplanation}`
            : "Ghi chú sẵn trong database: không có",
        ].filter(Boolean).join("\n"),
      },
    ],
    700,
    0.2
  );
}

export async function askEnglishChat(
  message: string,
  history: unknown
): Promise<string> {
  if (process.env.AI_HINTS_ENABLED === "false") {
    throw new AppError("Chatbot tiếng Anh đang tắt trên hệ thống.", 503);
  }

  const cleanMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!cleanMessage) {
    throw new AppError("Vui lòng nhập câu hỏi.", 400);
  }

  if (!isEnglishLearningQuestion(cleanMessage)) {
    return TOPIC_WARNING;
  }

  return requestChatCompletion([
    {
      role: "system",
      content: ENGLISH_TEACHER_SYSTEM_PROMPT,
    },
    ...normalizeHistory(history),
    { role: "user", content: cleanMessage },
  ]);
}
