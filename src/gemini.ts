import { z } from "zod";
import { stageGoals, stageLabels } from "./stages";
import type { CoachPayload, Env, SessionContext } from "./types";

const coachPayloadSchema = z.object({
  intent: z.enum([
    "answer",
    "deepen",
    "hint",
    "transition_request",
    "skip",
    "pause",
    "change_direction",
    "unknown",
  ]),
  feedback: z.string().default(""),
  gap: z.string().default(""),
  next_question: z.string().default(""),
  stage_ready: z.boolean().default(false),
  recommended_action: z.enum([
    "ask_next",
    "offer_transition",
    "stay_current",
    "summarize",
    "pause",
  ]),
  transition_reason: z.string().default(""),
  hint_level: z.number().int().min(0).max(3).default(0),
  evidence_notes: z.array(z.string()).default([]),
  progress_signals: z
    .array(
      z.object({
        criterion: z.string(),
        signal: z.enum(["strength", "practice"]),
        note: z.string(),
      }),
    )
    .optional(),
});

const responseSchema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "answer",
        "deepen",
        "hint",
        "transition_request",
        "skip",
        "pause",
        "change_direction",
        "unknown",
      ],
    },
    feedback: { type: "string" },
    gap: { type: "string" },
    next_question: { type: "string" },
    stage_ready: { type: "boolean" },
    recommended_action: {
      type: "string",
      enum: ["ask_next", "offer_transition", "stay_current", "summarize", "pause"],
    },
    transition_reason: { type: "string" },
    hint_level: { type: "integer" },
    evidence_notes: { type: "array", items: { type: "string" } },
    progress_signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          criterion: { type: "string" },
          signal: { type: "string", enum: ["strength", "practice"] },
          note: { type: "string" },
        },
        required: ["criterion", "signal", "note"],
      },
    },
  },
  required: [
    "intent",
    "feedback",
    "gap",
    "next_question",
    "stage_ready",
    "recommended_action",
    "transition_reason",
    "hint_level",
    "evidence_notes",
  ],
};

const systemInstruction = `Bạn là coach tư duy sản phẩm theo phương pháp gợi mở.

- Không đưa giải pháp mẫu trước khi người dùng đã tự thử.
- Mỗi lượt hỏi tối đa một câu trọng tâm.
- Phân biệt dữ kiện, giả định và suy luận.
- Khi người dùng trả lời, nêu một điểm cụ thể có cơ sở và một khoảng trống quan trọng.
- Nếu thiếu thông tin có thể làm đổi quyết định, hỏi tiếp trong stage hiện tại.
- Nếu stage đủ cơ sở, nêu lý do và đề xuất stage kế tiếp; không tự chuyển.
- Không coi "ok", "được" là đồng ý chuyển nếu ngữ cảnh chưa rõ.
- Gợi ý theo từng mức; chỉ giải đầy đủ khi người dùng yêu cầu.
- Không bịa số liệu hoặc case study. Chỉ nêu case study khi đầu vào có nguồn đã xác minh.
- Đánh giá bằng chứng, logic, hiểu người dùng, tính khả thi và trade-off; không chấm theo một đáp án duy nhất.
- Luôn giúp người dùng nối hành vi người dùng -> tâm lý/động lực -> giả thuyết -> product metrics -> cách kiểm chứng -> đánh giá giải pháp.
- Không tối ưu một metric đơn lẻ nếu có thể làm hại trust, accessibility, satisfaction, retention dài hạn hoặc một nhóm người dùng cụ thể.
- Khi nói về metrics, phân biệt metric chính, guardrail metric, yếu tố gây nhiễu và giới hạn dữ liệu; không coi tương quan là quan hệ nhân quả.
- Trả lời bằng tiếng Việt mặc định, giữ thuật ngữ Product Design phổ biến bằng tiếng Anh.`;

function buildPrompt(context: SessionContext, userMessage: string): string {
  const { session, recentTurns } = context;
  const turnSummary = recentTurns
    .map(
      (turn) =>
        `Stage ${stageLabels[turn.stage]}\nUser: ${turn.userMessage}\nBot: ${turn.botResponse}`,
    )
    .join("\n\n");

  return `Stage hiện tại: ${stageLabels[session.currentStage]}
Mục tiêu stage: ${stageGoals[session.currentStage]}
Topic: ${session.topic ?? "Chưa chọn"}
Trọng tâm phân tích: hành vi người dùng, tâm lý/động lực, giả thuyết, product metrics, nghiên cứu kiểm chứng, giải pháp và guardrail.
Độ khó: ${session.difficulty}
Hint level hiện tại: ${session.hintLevel}
Stage đang được đề xuất trước đó: ${session.proposedStage ?? "không có"}

Lịch sử gần đây:
${turnSummary || "Chưa có lượt trước."}

Tin nhắn mới nhất của người dùng:
${userMessage}

Hành động bot được phép đề xuất: hỏi tiếp, ở lại stage để đào sâu, đề xuất chuyển stage, tạm dừng, hoặc tổng kết. Backend mới được đổi stage.`;
}

function extractText(data: unknown): string {
  const response = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

export class GeminiAuthError extends Error {}
export class GeminiQuotaError extends Error {}
export class GeminiResponseError extends Error {}

function geminiErrorMessage(status: number, body: string): string {
  if (!body.trim()) return `Gemini request failed with ${status}`;

  try {
    const data = JSON.parse(body) as {
      error?: {
        message?: string;
        status?: string;
        details?: Array<{
          reason?: string;
        }>;
      };
    };
    const reason = data.error?.details?.find((detail) => detail.reason)?.reason;
    return [data.error?.status, reason, data.error?.message].filter(Boolean).join(": ");
  } catch {
    return body.slice(0, 300);
  }
}

export async function askGemini(
  env: Env,
  context: SessionContext,
  userMessage: string,
): Promise<CoachPayload> {
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(context, userMessage) }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseFormat: {
          text: {
            mimeType: "APPLICATION_JSON",
            schema: responseSchema,
          },
        },
      },
    }),
  });

  if (response.status === 429) {
    throw new GeminiQuotaError("Gemini quota exceeded");
  }

  if (!response.ok) {
    const message = geminiErrorMessage(response.status, await response.text());
    if (response.status === 401 || response.status === 403) {
      throw new GeminiAuthError(message);
    }
    throw new GeminiResponseError(message);
  }

  const text = extractText(await response.json());
  if (!text.trim()) {
    throw new GeminiResponseError("Gemini returned an empty response");
  }

  try {
    return coachPayloadSchema.parse(JSON.parse(text));
  } catch (error) {
    throw new GeminiResponseError(
      error instanceof Error ? error.message : "Invalid Gemini JSON response",
    );
  }
}
