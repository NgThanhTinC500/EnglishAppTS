import { AppError } from "../utils/appError";

type ChatRole = "user" | "assistant" | "system";

interface AiHintMessage {
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
const DEFAULT_TIMEOUT_MS = 60000;

const ENGLISH_TEACHER_SYSTEM_PROMPT = [
  "You are an English teacher for TT English.",
  "Explain answers clearly and concisely in Vietnamese unless English is more suitable.",
  "Use the provided database answer as the source of truth.",
  "Do not change the correct answer.",
  "Explain why the correct option is correct and why the selected option is wrong when needed.",
].join("\n");

function getTimeoutMs(): number {
  const timeout = Number(process.env.AI_HINT_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0
    ? Math.max(timeout, DEFAULT_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
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

async function postChatCompletion(
  url: string,
  body: Record<string, unknown>
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new AppError(
        errorText || "Không thể gọi API giải thích đáp án lúc này.",
        response.status >= 400 && response.status < 500 ? 400 : 502
      );
    }

    const answer = getAnswer(await parseCompletionResponse(response));
    if (!answer) {
      throw new AppError("API giải thích đáp án không trả về nội dung.", 502);
    }

    return answer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Không thể gọi API giải thích đáp án lúc này.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function buildPlainPrompt(messages: AiHintMessage[]) {
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
  messages: AiHintMessage[]
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
      throw new AppError("Không thể gọi API giải thích đáp án lúc này.", 502);
    }

    const answer = (await response.text()).trim();
    if (!answer) {
      throw new AppError("API giải thích đáp án không trả về nội dung.", 502);
    }

    return answer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("API giải thích đáp án đang bận, vui lòng thử lại sau.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestChatCompletion(
  messages: AiHintMessage[],
  maxTokens = 512,
  temperature = 0.3
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

export async function generateAnswerExplanation(
  input: AnswerExplanationInput
): Promise<string> {
  if (process.env.AI_HINTS_ENABLED === "false") {
    throw new AppError("Tính năng giải thích đáp án đang tắt trên hệ thống.", 503);
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
