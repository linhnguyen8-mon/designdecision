import { createId } from "./id";
import { isStage } from "./stages";
import type { CoachPayload, Env, FlowState, Session, Stage, Turn, UserSettings } from "./types";

type SessionRow = {
  id: string;
  telegram_user_id: string;
  topic: string | null;
  difficulty: UserSettings["difficulty"];
  status: Session["status"];
  current_stage: string;
  proposed_stage: string | null;
  hint_level: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

type TurnRow = {
  id: string;
  session_id: string;
  telegram_user_id: string;
  stage: string;
  user_message: string;
  bot_response: string;
  coach_payload_json: string;
  created_at: string;
};

type FlowStateRow = {
  telegram_user_id: string;
  flow: FlowState["flow"];
  step: FlowState["step"];
  data_json: string;
  updated_at: string;
};

function mapSession(row: SessionRow): Session {
  if (!isStage(row.current_stage)) {
    throw new Error(`Invalid stage stored in DB: ${row.current_stage}`);
  }

  const proposedStage =
    row.proposed_stage && isStage(row.proposed_stage) ? row.proposed_stage : null;

  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    topic: row.topic,
    difficulty: row.difficulty,
    status: row.status,
    currentStage: row.current_stage,
    proposedStage,
    hintLevel: row.hint_level,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapTurn(row: TurnRow): Turn {
  if (!isStage(row.stage)) {
    throw new Error(`Invalid turn stage stored in DB: ${row.stage}`);
  }

  return {
    id: row.id,
    sessionId: row.session_id,
    telegramUserId: row.telegram_user_id,
    stage: row.stage,
    userMessage: row.user_message,
    botResponse: row.bot_response,
    coachPayloadJson: row.coach_payload_json,
    createdAt: row.created_at,
  };
}

function mapFlowState(row: FlowStateRow): FlowState {
  return {
    telegramUserId: row.telegram_user_id,
    flow: row.flow,
    step: row.step,
    data: JSON.parse(row.data_json) as Record<string, unknown>,
    updatedAt: row.updated_at,
  };
}

export class BotRepository {
  constructor(private readonly env: Env) {}

  async markUpdateProcessing(updateId: number): Promise<boolean> {
    const result = await this.env.DB.prepare(
      "INSERT OR IGNORE INTO processed_updates (update_id) VALUES (?)",
    )
      .bind(updateId)
      .run();

    return (result.meta.changes ?? 0) > 0;
  }

  async ensureUser(telegramUserId: string): Promise<UserSettings> {
    await this.env.DB.prepare(
      `INSERT OR IGNORE INTO users (telegram_user_id) VALUES (?)`,
    )
      .bind(telegramUserId)
      .run();

    const user = await this.env.DB.prepare(
      `SELECT telegram_user_id, language, difficulty, duration
       FROM users
       WHERE telegram_user_id = ?`,
    )
      .bind(telegramUserId)
      .first<{
        telegram_user_id: string;
        language: UserSettings["language"];
        difficulty: UserSettings["difficulty"];
        duration: UserSettings["duration"];
      }>();

    if (!user) {
      throw new Error("Could not create or load user");
    }

    return {
      telegramUserId: user.telegram_user_id,
      language: user.language,
      difficulty: user.difficulty,
      duration: user.duration,
    };
  }

  async updateUserDifficulty(
    telegramUserId: string,
    difficulty: UserSettings["difficulty"],
  ): Promise<void> {
    await this.env.DB.prepare(
      `UPDATE users
       SET difficulty = ?, updated_at = CURRENT_TIMESTAMP
       WHERE telegram_user_id = ?`,
    )
      .bind(difficulty, telegramUserId)
      .run();
  }

  async createSession(telegramUserId: string, topic: string | null): Promise<Session> {
    const user = await this.ensureUser(telegramUserId);
    const id = createId("ses");

    await this.env.DB.prepare(
      `INSERT INTO sessions
       (id, telegram_user_id, topic, difficulty, status, current_stage)
       VALUES (?, ?, ?, ?, 'active', 'frame')`,
    )
      .bind(id, telegramUserId, topic, user.difficulty)
      .run();

    const session = await this.getSessionById(id);
    if (!session) throw new Error("Could not load created session");
    return session;
  }

  async pauseActiveSessions(telegramUserId: string): Promise<void> {
    await this.env.DB.prepare(
      `UPDATE sessions
       SET status = 'paused', updated_at = CURRENT_TIMESTAMP
       WHERE telegram_user_id = ? AND status = 'active'`,
    )
      .bind(telegramUserId)
      .run();
  }

  async getSessionById(id: string): Promise<Session | null> {
    const row = await this.env.DB.prepare(
      `SELECT * FROM sessions WHERE id = ?`,
    )
      .bind(id)
      .first<SessionRow>();

    return row ? mapSession(row) : null;
  }

  async getActiveSession(telegramUserId: string): Promise<Session | null> {
    const row = await this.env.DB.prepare(
      `SELECT * FROM sessions
       WHERE telegram_user_id = ? AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
      .bind(telegramUserId)
      .first<SessionRow>();

    return row ? mapSession(row) : null;
  }

  async getLatestSession(telegramUserId: string): Promise<Session | null> {
    const row = await this.env.DB.prepare(
      `SELECT * FROM sessions
       WHERE telegram_user_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
      .bind(telegramUserId)
      .first<SessionRow>();

    return row ? mapSession(row) : null;
  }

  async getRecentTurns(sessionId: string, limit = 8): Promise<Turn[]> {
    const result = await this.env.DB.prepare(
      `SELECT * FROM turns
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
      .bind(sessionId, limit)
      .all<TurnRow>();

    return result.results.map(mapTurn).reverse();
  }

  async setFlowState(args: {
    telegramUserId: string;
    flow: FlowState["flow"];
    step: FlowState["step"];
    data?: Record<string, unknown>;
  }): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO flow_states (telegram_user_id, flow, step, data_json, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(telegram_user_id) DO UPDATE SET
         flow = excluded.flow,
         step = excluded.step,
         data_json = excluded.data_json,
         updated_at = CURRENT_TIMESTAMP`,
    )
      .bind(args.telegramUserId, args.flow, args.step, JSON.stringify(args.data ?? {}))
      .run();
  }

  async getFlowState(telegramUserId: string): Promise<FlowState | null> {
    const row = await this.env.DB.prepare(
      `SELECT * FROM flow_states WHERE telegram_user_id = ?`,
    )
      .bind(telegramUserId)
      .first<FlowStateRow>();

    return row ? mapFlowState(row) : null;
  }

  async clearFlowState(telegramUserId: string): Promise<void> {
    await this.env.DB.prepare(`DELETE FROM flow_states WHERE telegram_user_id = ?`)
      .bind(telegramUserId)
      .run();
  }

  async addTurn(args: {
    sessionId: string;
    telegramUserId: string;
    stage: Stage;
    userMessage: string;
    botResponse: string;
    payload: CoachPayload;
  }): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO turns
       (id, session_id, telegram_user_id, stage, user_message, bot_response, coach_payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        createId("turn"),
        args.sessionId,
        args.telegramUserId,
        args.stage,
        args.userMessage,
        args.botResponse,
        JSON.stringify(args.payload),
      )
      .run();
  }

  async updateSession(args: {
    sessionId: string;
    currentStage?: Stage;
    proposedStage?: Stage | null;
    status?: Session["status"];
    hintLevel?: number;
  }): Promise<void> {
    const session = await this.getSessionById(args.sessionId);
    if (!session) throw new Error("Session not found");

    const nextStatus = args.status ?? session.status;
    await this.env.DB.prepare(
      `UPDATE sessions
       SET current_stage = ?,
           proposed_stage = ?,
           status = ?,
           hint_level = ?,
           updated_at = CURRENT_TIMESTAMP,
           completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = ?`,
    )
      .bind(
        args.currentStage ?? session.currentStage,
        args.proposedStage === undefined ? session.proposedStage : args.proposedStage,
        nextStatus,
        args.hintLevel ?? session.hintLevel,
        nextStatus,
        args.sessionId,
      )
      .run();
  }

  async addProgressSignals(args: {
    telegramUserId: string;
    sessionId: string;
    signals: NonNullable<CoachPayload["progress_signals"]>;
  }): Promise<void> {
    for (const signal of args.signals.slice(0, 3)) {
      await this.env.DB.prepare(
        `INSERT INTO progress
         (id, telegram_user_id, session_id, criterion, signal, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          createId("prog"),
          args.telegramUserId,
          args.sessionId,
          signal.criterion,
          signal.signal,
          signal.note,
        )
        .run();
    }
  }

  async getProgressSummary(telegramUserId: string): Promise<
    Array<{ criterion: string; strengthCount: number; practiceCount: number; latestNote: string }>
  > {
    const result = await this.env.DB.prepare(
      `SELECT
         criterion,
         SUM(CASE WHEN signal = 'strength' THEN 1 ELSE 0 END) AS strength_count,
         SUM(CASE WHEN signal = 'practice' THEN 1 ELSE 0 END) AS practice_count,
         MAX(created_at || '|' || note) AS latest_note
       FROM progress
       WHERE telegram_user_id = ?
       GROUP BY criterion
       ORDER BY (strength_count + practice_count) DESC, criterion ASC
       LIMIT 8`,
    )
      .bind(telegramUserId)
      .all<{
        criterion: string;
        strength_count: number;
        practice_count: number;
        latest_note: string;
      }>();

    return result.results.map((row) => ({
      criterion: row.criterion,
      strengthCount: Number(row.strength_count ?? 0),
      practiceCount: Number(row.practice_count ?? 0),
      latestNote: row.latest_note?.split("|").slice(1).join("|") ?? "",
    }));
  }

  async pauseSession(sessionId: string): Promise<void> {
    await this.updateSession({ sessionId, status: "paused" });
  }

  async resumeLatestSession(telegramUserId: string): Promise<Session | null> {
    const latest = await this.getLatestSession(telegramUserId);
    if (!latest) return null;
    if (latest.status === "completed") return latest;

    await this.updateSession({ sessionId: latest.id, status: "active" });
    return this.getSessionById(latest.id);
  }

  async deleteUserHistory(telegramUserId: string): Promise<void> {
    await this.env.DB.batch([
      this.env.DB.prepare("DELETE FROM flow_states WHERE telegram_user_id = ?").bind(
        telegramUserId,
      ),
      this.env.DB.prepare("DELETE FROM progress WHERE telegram_user_id = ?").bind(
        telegramUserId,
      ),
      this.env.DB.prepare("DELETE FROM turns WHERE telegram_user_id = ?").bind(
        telegramUserId,
      ),
      this.env.DB.prepare("DELETE FROM sessions WHERE telegram_user_id = ?").bind(
        telegramUserId,
      ),
      this.env.DB.prepare("DELETE FROM users WHERE telegram_user_id = ?").bind(
        telegramUserId,
      ),
    ]);
  }
}
