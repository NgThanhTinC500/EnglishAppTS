import { AppError } from "../utils/appError";

type ChatRole = "user" | "assistant";

export interface EnglishChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  text?: string;
  content?: string;
}

const DEFAULT_AI_HINT_API_URL = "https://text.pollinations.ai";
const DEFAULT_MODEL = "openai";
const MAX_MESSAGE_LENGTH = 700;
const MAX_HISTORY_ITEMS = 8;
const DEFAULT_TIMEOUT_MS = 3500;
const TOPIC_WARNING =
  "Mình chỉ trả lời câu hỏi về ngữ pháp và từ vựng tiếng Anh. Hãy hỏi về nghĩa từ, cách dùng, cấu trúc câu hoặc ví dụ tiếng Anh nhé.";

const englishTopicPattern =
  /\b(english|grammar|vocabulary|vocab|word|phrase|sentence|meaning|pronunciation|pronounce|tense|verb|noun|adjective|adverb|preposition|article|clause|idiom|synonym|antonym|toeic|ielts|translate|translation|collocation|phrasal|past|present|future|perfect|continuous|plural|singular|compare|difference|usage|example)\b/i;

const vietnameseEnglishTopicPattern =
  /(tiếng anh|tieng anh|ngữ pháp|ngu phap|từ vựng|tu vung|dịch|dich|nghĩa|nghia|phát âm|phat am|câu|cau|thì |thi |động từ|dong tu|danh từ|danh tu|tính từ|tinh tu|trạng từ|trang tu|giới từ|gioi tu|mạo từ|mao tu|cụm từ|cum tu|thành ngữ|thanh ngu|ví dụ|vi du|so sánh|so sanh|cách dùng|cach dung)/i;

const offTopicPattern =
  /\b(weather|bitcoin|crypto|stock|price|football|movie|recipe|code|programming|politics|news|game|music|travel|hotel|restaurant|medical|doctor|law|legal|math|history|science)\b/i;

export function isEnglishLearningQuestion(message: string): boolean {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) return false;

  if (offTopicPattern.test(normalizedMessage)) return false;

  const looksLikeShortVocabularyItem =
    /^[A-Za-z][A-Za-z\s'-]{0,60}$/.test(normalizedMessage) &&
    normalizedMessage.split(/\s+/).length <= 4;

  return (
    englishTopicPattern.test(normalizedMessage) ||
    vietnameseEnglishTopicPattern.test(normalizedMessage) ||
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

function getPollinationsUrl(): string {
  const baseUrl = (
    process.env.AI_HINT_API_URL || DEFAULT_AI_HINT_API_URL
  ).replace(/\/+$/, "");

  return baseUrl.endsWith("/openai") ? baseUrl : `${baseUrl}/openai`;
}

function getTimeoutMs(): number {
  const timeout = Number(process.env.AI_HINT_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS;
}

function getAnswer(data: ChatCompletionResponse): string {
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    data?.text?.trim() ||
    data?.content?.trim() ||
    ""
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(getPollinationsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_HINT_MODEL || DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý học tiếng Anh cho website TT English. Chỉ trả lời các câu hỏi liên quan đến ngữ pháp tiếng Anh, từ vựng, nghĩa từ, cách dùng, ví dụ câu, phát âm, collocation, phrasal verbs, TOEIC/IELTS English. Nếu người dùng hỏi chủ đề khác, từ chối lịch sự bằng tiếng Việt trong 1 câu. Câu trả lời phải ngắn gọn, dễ đọc, format đẹp bằng markdown tối giản: dùng tiêu đề đậm, bullet ngắn, ví dụ tiếng Anh rõ ràng. Không trả lời lan man.",
          },
          ...normalizeHistory(history),
          { role: "user", content: cleanMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError("Không thể gọi API chatbot lúc này.", 502);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const answer = getAnswer(data);

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
