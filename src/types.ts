import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  GEMINI_API_KEY: string;
  ALLOWED_TELEGRAM_USER_IDS: string;
  GEMINI_MODEL?: string;
}

export const stages = [
  "frame",
  "research",
  "synthesize",
  "ideate",
  "prioritize",
  "validate",
] as const;

export type Stage = (typeof stages)[number];

export type SessionStatus = "active" | "paused" | "completed";

export interface UserSettings {
  telegramUserId: string;
  language: "vi" | "en";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "short" | "medium" | "long";
}

export interface Session {
  id: string;
  telegramUserId: string;
  topic: string | null;
  difficulty: UserSettings["difficulty"];
  status: SessionStatus;
  currentStage: Stage;
  proposedStage: Stage | null;
  hintLevel: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Turn {
  id: string;
  sessionId: string;
  telegramUserId: string;
  stage: Stage;
  userMessage: string;
  botResponse: string;
  coachPayloadJson: string;
  createdAt: string;
}

export interface CoachPayload {
  intent:
    | "answer"
    | "deepen"
    | "hint"
    | "transition_request"
    | "skip"
    | "pause"
    | "change_direction"
    | "unknown";
  feedback: string;
  gap: string;
  next_question: string;
  stage_ready: boolean;
  recommended_action:
    | "ask_next"
    | "offer_transition"
    | "stay_current"
    | "summarize"
    | "pause";
  transition_reason: string;
  hint_level: number;
  evidence_notes: string[];
  progress_signals?: Array<{
    criterion: string;
    signal: "strength" | "practice";
    note: string;
  }> | undefined;
}

export interface SessionContext {
  session: Session;
  recentTurns: Turn[];
}

export interface FlowState {
  telegramUserId: string;
  flow: "new_session";
  step:
    | "entry"
    | "category"
    | "random_scope"
    | "keyword"
    | "scenario"
    | "active_conflict";
  data: Record<string, unknown>;
  updatedAt: string;
}
