import { Bot, InlineKeyboard, type Context } from "grammy";
import { determineProposedStage } from "./coach-state";
import { BotRepository } from "./db";
import { askGemini, GeminiQuotaError, GeminiResponseError } from "./gemini";
import {
  getCategory,
  getKeyword,
  getScenario,
  randomScenario,
  scenarioLibrary,
  scenariosPerPage,
  topicFromScenario,
  type ScenarioCategory,
  type ScenarioKeyword,
} from "./scenarios";
import {
  nextStage,
  previousStage,
  formatStagePath,
  stageDisplayName,
  stageGoals,
  stageLabels,
} from "./stages";
import { escapeMarkdown, section } from "./telegram-format";
import type { CoachPayload, Env, FlowState, Session, Stage, Turn, UserSettings } from "./types";

function allowedUserIds(env: Env): Set<number> {
  return new Set(
    env.ALLOWED_TELEGRAM_USER_IDS.split(",")
      .map((id) => Number(id.trim()))
      .filter(Number.isFinite),
  );
}

async function requireAllowed(ctx: Context, env: Env): Promise<string | null> {
  const userId = ctx.from?.id;
  if (!userId || !allowedUserIds(env).has(userId)) {
    return null;
  }

  return String(userId);
}

function commandText(ctx: Context): string {
  return ctx.message?.text?.replace(/^\/\w+\s*/, "").trim() ?? "";
}

const categoryIcons: Record<string, string> = {
  ai: "🤖",
  business: "📊",
  collaboration: "🤝",
  communication: "💬",
  crm: "🗂️",
  "developer-tools": "🧰",
  education: "🎓",
  entertainment: "🎬",
  finance: "💳",
  "food-drink": "🍽️",
  "graphic-design": "🎨",
  "health-fitness": "💪",
  recruitment: "🧑‍💼",
  lifestyle: "🌿",
  medical: "🏥",
  music: "🎧",
  "maps-navigation": "🗺️",
  news: "📰",
  "photo-video": "📷",
  productivity: "✅",
  reference: "📚",
  shopping: "🛒",
  "social-networking": "👥",
  "travel-transportation": "✈️",
  utilities: "⚙️",
};

function categoryButtonLabel(category: ScenarioCategory): string {
  return `${categoryIcons[category.id] ?? "•"} ${category.label}`;
}

function transitionKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔍 Đào sâu", "deepen")
    .text("➡️ Sang bước tiếp", "continue");
}

function newEntryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🗂️ Chọn lĩnh vực", "new:choose")
    .text("🎲 Scenario ngẫu nhiên", "new:random")
    .row()
    .text("✖️ Hủy", "new:cancel");
}

function activeConflictKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("▶️ Tiếp tục phiên hiện tại", "new:keep")
    .row()
    .text("✨ Bắt đầu phiên mới", "new:replace")
    .row()
    .text("✖️ Hủy", "new:cancel");
}

function randomScopeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🌐 Toàn thư viện", "rand:all")
    .row()
    .text("🗂️ Chọn category", "rand:category")
    .row()
    .text("↩️ Quay lại", "back:entry")
    .text("✖️ Hủy", "new:cancel");
}

function categoryKeyboard(mode: "choose" | "random"): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const prefix = mode === "random" ? "rcat" : "cat";

  for (const category of scenarioLibrary) {
    keyboard.text(categoryButtonLabel(category), `${prefix}:${category.id}`).row();
  }

  keyboard.text(
    mode === "random" ? "🎲 Đổi phạm vi" : "↩️ Quay lại",
    mode === "random" ? "new:random" : "back:entry",
  );
  keyboard.text("✖️ Hủy", "new:cancel");
  return keyboard;
}

function keywordKeyboard(category: ScenarioCategory): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const item of category.keywords) {
    keyboard.text(`🔎 ${item.label}`, `kw:${category.id}:${item.id}`).row();
  }
  keyboard.text("🗂️ Đổi category", "cat:page:0").text("✖️ Hủy", "new:cancel");
  return keyboard;
}

function scenarioKeyboard(
  category: ScenarioCategory,
  keyword: ScenarioKeyword,
  page: number,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const pageCount = Math.ceil(keyword.scenarios.length / scenariosPerPage);
  const start = page * scenariosPerPage;

  for (const item of keyword.scenarios.slice(start, start + scenariosPerPage)) {
    keyboard.text(`🎯 ${item.title}`, `sc:${category.id}:${keyword.id}:${item.id}`).row();
  }

  if (page > 0) keyboard.text("↩️ Quay lại", `scpage:${category.id}:${keyword.id}:${page - 1}`);
  if (page < pageCount - 1) keyboard.text("➡️ Tiếp", `scpage:${category.id}:${keyword.id}:${page + 1}`);
  keyboard.row().text("🔎 Đổi keyword", `back:kw:${category.id}`);
  keyboard.text("🗂️ Đổi category", "cat:page:0").row().text("✖️ Hủy", "new:cancel");
  return keyboard;
}

function renderCoachResponse(payload: CoachPayload, proposedStage: Stage | null): string {
  const parts = [
    section("Điểm đáng giữ", payload.feedback),
    section("Khoảng trống", payload.gap),
    section("Câu hỏi tiếp theo", payload.next_question),
  ].filter(Boolean);

  if (proposedStage) {
    parts.push(
      section(
        "Đề xuất hướng đi",
        `${payload.transition_reason} Tôi đề xuất sang ${stageDisplayName(proposedStage)}.`,
      ),
    );
  }

  if (payload.evidence_notes.length > 0) {
    parts.push(
      section("Ghi chú bằng chứng", payload.evidence_notes.map((note) => `- ${note}`).join("\n")),
    );
  }

  return parts.join("\n\n");
}

const stageOpeningQuestions: Record<Stage, string[]> = {
  frame: [
    "Ai là nhóm người dùng chính trong scenario này?",
    "Họ đang ở bối cảnh nào khi vấn đề xảy ra?",
    "Hành vi chính là gì: họ đang làm gì, không làm gì, hoặc bỏ cuộc ở đâu?",
    "Dấu hiệu nào cho thấy vấn đề này ảnh hưởng đến trải nghiệm hoặc kết quả sản phẩm?",
  ],
  research: [
    "Điều gì hiện mới là giả định, chưa phải dữ kiện?",
    "Bạn cần biết thêm gì về hành vi, động lực hoặc rào cản của người dùng?",
    "Bạn sẽ kiểm chứng bằng dữ liệu định lượng, nghiên cứu định tính, hay cả hai?",
  ],
  synthesize: [
    "Dữ kiện nào bạn đã có hoặc có thể quan sát được?",
    "Đâu là suy luận của bạn từ các dữ kiện đó?",
    "Có insight nào giải thích được hành vi nhưng vẫn cần kiểm chứng thêm không?",
  ],
  ideate: [
    "Có những hướng giải quyết khác nhau nào, không chỉ một phương án đầu tiên?",
    "Mỗi hướng đang tác động vào hành vi hoặc rào cản nào?",
    "Hướng nào có rủi ro làm metric đẹp hơn nhưng trải nghiệm xấu đi?",
  ],
  prioritize: [
    "Bạn chọn hướng nào trước, và vì sao?",
    "Trade-off chính là gì: tốc độ, trust, accessibility, effort hay impact?",
    "Metric chính và guardrail metric nào nên theo dõi?",
  ],
  validate: [
    "Bạn muốn kiểm chứng giả thuyết nào trước?",
    "Kết quả nào đủ mạnh để xem là có tín hiệu tích cực?",
    "Có nhóm người dùng nào có thể bị ảnh hưởng tiêu cực dù kết quả trung bình tốt lên không?",
  ],
};

function numberedQuestions(stage: Stage): string {
  return stageOpeningQuestions[stage]
    .map((question, index) => escapeMarkdown(`${index + 1}. ${question}`))
    .join("\n");
}

function openingQuestion(session: Session): string {
  return [
    `Bắt đầu stage *${escapeMarkdown(stageDisplayName(session.currentStage))}*\\.`,
    escapeMarkdown(stageGoals[session.currentStage]),
    "",
    "*Câu hỏi gợi ý*",
    numberedQuestions(session.currentStage),
  ].join("\n");
}

async function sendLong(ctx: Context, text: string, keyboard?: InlineKeyboard): Promise<void> {
  const options: Parameters<typeof ctx.reply>[1] = { parse_mode: "MarkdownV2" };
  if (keyboard) options.reply_markup = keyboard;
  await ctx.reply(text, options);
}

async function safeAnswerCallback(ctx: Context): Promise<void> {
  try {
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.warn("Could not answer callback query", error);
  }
}

async function getContext(repo: BotRepository, session: Session) {
  return {
    session,
    recentTurns: await repo.getRecentTurns(session.id),
  };
}

function stageAfterSkip(session: Session): Stage | null {
  return nextStage(session.currentStage);
}

async function showNewEntry(ctx: Context, repo: BotRepository, telegramUserId: string): Promise<void> {
  await repo.setFlowState({
    telegramUserId,
    flow: "new_session",
    step: "entry",
  });
  await sendLong(
    ctx,
    escapeMarkdown("Bạn muốn bắt đầu buổi luyện như thế nào?"),
    newEntryKeyboard(),
  );
}

async function showRandomScope(
  ctx: Context,
  repo: BotRepository,
  telegramUserId: string,
): Promise<void> {
  await repo.setFlowState({
    telegramUserId,
    flow: "new_session",
    step: "random_scope",
  });
  await sendLong(
    ctx,
    escapeMarkdown("Bạn muốn random scenario từ đâu? Nếu chưa chắc, chọn toàn thư viện."),
    randomScopeKeyboard(),
  );
}

async function showCategoryPage(args: {
  ctx: Context;
  repo: BotRepository;
  telegramUserId: string;
  page: number;
  mode: "choose" | "random";
}): Promise<void> {
  const { ctx, repo, telegramUserId, page, mode } = args;
  await repo.setFlowState({
    telegramUserId,
    flow: "new_session",
    step: "category",
    data: { page, mode },
  });
  await sendLong(
    ctx,
    escapeMarkdown(
      mode === "random"
        ? "Chọn category để random scenario."
        : "Chọn lĩnh vực bạn muốn luyện.",
    ),
    categoryKeyboard(mode),
  );
}

async function showKeywordList(args: {
  ctx: Context;
  repo: BotRepository;
  telegramUserId: string;
  category: ScenarioCategory;
}): Promise<void> {
  const { ctx, repo, telegramUserId, category } = args;
  await repo.setFlowState({
    telegramUserId,
    flow: "new_session",
    step: "keyword",
    data: { categoryId: category.id },
  });
  await sendLong(
    ctx,
    [
      `*${escapeMarkdown(category.label)}*`,
      escapeMarkdown("Chọn keyword/chủ đề scenario phổ biến để luyện."),
    ].join("\n"),
    keywordKeyboard(category),
  );
}

async function showScenarioList(args: {
  ctx: Context;
  repo: BotRepository;
  telegramUserId: string;
  category: ScenarioCategory;
  keyword: ScenarioKeyword;
  page: number;
}): Promise<void> {
  const { ctx, repo, telegramUserId, category, keyword, page } = args;
  await repo.setFlowState({
    telegramUserId,
    flow: "new_session",
    step: "scenario",
    data: { categoryId: category.id, keywordId: keyword.id, page },
  });

  const start = page * scenariosPerPage;
  const descriptions = keyword.scenarios
    .slice(start, start + scenariosPerPage)
    .map((item) => `• ${item.title}: ${item.context}`)
    .join("\n");

  await sendLong(
    ctx,
    [
      `*${escapeMarkdown(category.label)} / ${escapeMarkdown(keyword.label)}*`,
      escapeMarkdown("Chọn một scenario. Mô tả chỉ là bối cảnh ban đầu, chưa có insight hay giải pháp."),
      "",
      escapeMarkdown(descriptions),
    ].join("\n"),
    scenarioKeyboard(category, keyword, page),
  );
}

async function startScenario(args: {
  ctx: Context;
  repo: BotRepository;
  telegramUserId: string;
  category: ScenarioCategory;
  keyword: ScenarioKeyword;
  scenarioId: string;
}): Promise<void> {
  const { ctx, repo, telegramUserId, category, keyword, scenarioId } = args;
  const selected = getScenario(category.id, keyword.id, scenarioId);
  if (!selected) {
    await sendLong(ctx, escapeMarkdown("Scenario này không còn hợp lệ. Hãy chọn lại scenario khác."));
    await showScenarioList({ ctx, repo, telegramUserId, category, keyword, page: 0 });
    return;
  }

  await repo.pauseActiveSessions(telegramUserId);
  const session = await repo.createSession(
    telegramUserId,
    topicFromScenario({ category, keyword, scenario: selected }),
  );
  await repo.clearFlowState(telegramUserId);
  await sendLong(
    ctx,
    [
      `*${escapeMarkdown(selected.title)}*`,
      section("Bối cảnh", selected.context),
      section("Vai trò của bạn", selected.role),
      section("Trọng tâm luyện", "Hành vi người dùng → tâm lý/động lực → giả thuyết → product metrics → kiểm chứng → giải pháp và guardrail."),
      "",
      escapeMarkdown(formatStagePath(session.currentStage)),
      "",
      openingQuestion(session),
    ].join("\n\n"),
  );
}

async function startRandomScenario(args: {
  ctx: Context;
  repo: BotRepository;
  telegramUserId: string;
  categoryId?: string;
}): Promise<void> {
  const picked = randomScenario(args.categoryId);
  await startScenario({
    ctx: args.ctx,
    repo: args.repo,
    telegramUserId: args.telegramUserId,
    category: picked.category,
    keyword: picked.keyword,
    scenarioId: picked.scenario.id,
  });
}

async function resendFlowHint(
  ctx: Context,
  repo: BotRepository,
  telegramUserId: string,
  flow: FlowState,
): Promise<void> {
  if (flow.step === "category") {
    const page = typeof flow.data.page === "number" ? flow.data.page : 0;
    const mode = flow.data.mode === "random" ? "random" : "choose";
    await showCategoryPage({ ctx, repo, telegramUserId, page, mode });
    return;
  }

  if (flow.step === "keyword" && typeof flow.data.categoryId === "string") {
    const category = getCategory(flow.data.categoryId);
    if (category) {
      await showKeywordList({ ctx, repo, telegramUserId, category });
      return;
    }
  }

  if (
    flow.step === "scenario" &&
    typeof flow.data.categoryId === "string" &&
    typeof flow.data.keywordId === "string"
  ) {
    const category = getCategory(flow.data.categoryId);
    const keyword = getKeyword(flow.data.categoryId, flow.data.keywordId);
    if (category && keyword) {
      const page = typeof flow.data.page === "number" ? flow.data.page : 0;
      await showScenarioList({ ctx, repo, telegramUserId, category, keyword, page });
      return;
    }
  }

  if (flow.step === "random_scope") {
    await showRandomScope(ctx, repo, telegramUserId);
    return;
  }

  await showNewEntry(ctx, repo, telegramUserId);
}

async function processUserAnswer(args: {
  ctx: Context;
  env: Env;
  repo: BotRepository;
  telegramUserId: string;
  session: Session;
  message: string;
}): Promise<void> {
  const { ctx, env, repo, telegramUserId, session, message } = args;

  try {
    const context = await getContext(repo, session);
    const payload = await askGemini(env, context, message);
    const proposedStage = determineProposedStage(session.currentStage, payload);
    const botResponse = renderCoachResponse(payload, proposedStage);

    await repo.addTurn({
      sessionId: session.id,
      telegramUserId,
      stage: session.currentStage,
      userMessage: message,
      botResponse,
      payload,
    });

    await repo.updateSession({
      sessionId: session.id,
      proposedStage,
      hintLevel: payload.hint_level,
    });

    if (payload.progress_signals?.length) {
      await repo.addProgressSignals({
        telegramUserId,
        sessionId: session.id,
        signals: payload.progress_signals,
      });
    }

    await sendLong(ctx, botResponse, proposedStage ? transitionKeyboard() : undefined);
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      await repo.addTurn({
        sessionId: session.id,
        telegramUserId,
        stage: session.currentStage,
        userMessage: message,
        botResponse:
          "Gemini đang hết quota. Mình đã lưu câu trả lời và giữ nguyên stage để tiếp tục sau.",
        payload: {
          intent: "answer",
          feedback: "",
          gap: "Gemini quota exceeded",
          next_question: "",
          stage_ready: false,
          recommended_action: "stay_current",
          transition_reason: "",
          hint_level: session.hintLevel,
          evidence_notes: [],
        },
      });
      await sendLong(
        ctx,
        escapeMarkdown(
          "Gemini đang hết quota. Mình đã lưu câu trả lời và giữ nguyên stage để bạn tiếp tục sau.",
        ),
      );
      return;
    }

    if (error instanceof GeminiResponseError) {
      await sendLong(
        ctx,
        escapeMarkdown(
          "Gemini trả về phản hồi không hợp lệ hoặc đang lỗi. Stage chưa đổi; bạn có thể thử lại sau một chút.",
        ),
      );
      return;
    }

    throw error;
  }
}

async function requireSession(
  ctx: Context,
  repo: BotRepository,
  telegramUserId: string,
): Promise<Session | null> {
  const session = await repo.getActiveSession(telegramUserId);
  if (!session) {
    await sendLong(
      ctx,
      escapeMarkdown("Chưa có buổi active. Dùng /new để bắt đầu hoặc /resume để tiếp tục buổi đã lưu."),
    );
  }
  return session;
}

async function continueSession(
  ctx: Context,
  repo: BotRepository,
  telegramUserId: string,
): Promise<void> {
  const session = await requireSession(ctx, repo, telegramUserId);
  if (!session) return;

  if (!session.proposedStage) {
    await sendLong(ctx, escapeMarkdown("Chưa có stage kế tiếp được đề xuất. Mình sẽ hỏi tiếp trong stage hiện tại."));
    return;
  }

  await repo.updateSession({
    sessionId: session.id,
    currentStage: session.proposedStage,
    proposedStage: null,
    hintLevel: 0,
  });
  const updated = await repo.getSessionById(session.id);
  if (updated) await sendLong(ctx, openingQuestion(updated));
}

async function deepenSession(
  ctx: Context,
  repo: BotRepository,
  telegramUserId: string,
): Promise<void> {
  const session = await requireSession(ctx, repo, telegramUserId);
  if (!session) return;
  await repo.updateSession({ sessionId: session.id, proposedStage: null });
  await sendLong(ctx, escapeMarkdown("Mình giữ stage hiện tại. Hãy đào sâu thêm bằng một ví dụ, dữ kiện, hoặc giả định bạn muốn kiểm tra."));
}

function renderTurns(turns: Turn[]): string {
  if (turns.length === 0) return "Buổi này chưa có câu trả lời nào.";

  return turns
    .map(
      (turn, index) =>
        `${index + 1}. [${stageDisplayName(turn.stage)}] ${turn.userMessage}`,
    )
    .join("\n");
}

export function createBot(env: Env, repo: BotRepository): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    const telegramUserId = await requireAllowed(ctx, env);
    if (!telegramUserId) return;
    await repo.ensureUser(telegramUserId);
    await next();
  });

  bot.command(["start", "help"], async (ctx) => {
    await sendLong(
      ctx,
      [
        "*Design Decision Bot*",
        escapeMarkdown("Mình là coach tư duy thiết kế sản phẩm: hỏi tiếp, chỉ ra khoảng trống, và đề xuất bước kế tiếp thay vì đưa đáp án sẵn."),
        "",
        escapeMarkdown("Lệnh chính: /new, /resume, /pause, /continue, /deepen, /hint, /skip, /back, /review, /summary, /progress, /settings, /delete."),
        escapeMarkdown("Dùng /new để chọn lĩnh vực, keyword và scenario; hoặc random một scenario từ thư viện."),
      ].join("\n"),
    );
  });

  bot.command("new", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const customTopic = commandText(ctx);
    const activeSession = await repo.getActiveSession(telegramUserId);
    if (activeSession) {
      await repo.setFlowState({
        telegramUserId,
        flow: "new_session",
        step: "active_conflict",
        data: customTopic ? { customTopic } : {},
      });
      await sendLong(
        ctx,
        escapeMarkdown("Bạn đang có một phiên active. Bạn muốn tiếp tục phiên hiện tại hay bắt đầu phiên mới?"),
        activeConflictKeyboard(),
      );
      return;
    }

    if (!customTopic) {
      await showNewEntry(ctx, repo, telegramUserId);
      return;
    }

    await repo.clearFlowState(telegramUserId);
    const session = await repo.createSession(telegramUserId, customTopic);
    await sendLong(
      ctx,
      [
        `Topic: *${escapeMarkdown(customTopic)}*`,
        escapeMarkdown(formatStagePath(session.currentStage)),
        "",
        openingQuestion(session),
      ].join("\n"),
    );
  });

  bot.command("topic", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const topic = commandText(ctx);
    if (!topic) {
      await showNewEntry(ctx, repo, telegramUserId);
      return;
    }

    await repo.pauseActiveSessions(telegramUserId);
    await repo.clearFlowState(telegramUserId);
    const session = await repo.createSession(telegramUserId, topic);
    await sendLong(ctx, `Topic mới: *${escapeMarkdown(topic)}*\n\n${openingQuestion(session)}`);
  });

  bot.command("level", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const value = commandText(ctx).toLowerCase();
    const allowed = ["beginner", "intermediate", "advanced"] as const;
    if (!allowed.includes(value as UserSettings["difficulty"])) {
      await sendLong(
        ctx,
        escapeMarkdown("Dùng /level beginner, /level intermediate hoặc /level advanced."),
      );
      return;
    }

    await repo.updateUserDifficulty(telegramUserId, value as UserSettings["difficulty"]);
    await sendLong(ctx, escapeMarkdown(`Đã đổi độ khó sang ${value}.`));
  });

  bot.command("pause", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;
    await repo.pauseSession(session.id);
    await sendLong(ctx, escapeMarkdown("Đã tạm dừng và lưu buổi hiện tại. Dùng /resume để quay lại."));
  });

  bot.command("resume", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await repo.resumeLatestSession(telegramUserId);
    if (!session || session.status === "completed") {
      await sendLong(ctx, escapeMarkdown("Không có buổi đang lưu để tiếp tục. Dùng /new để bắt đầu."));
      return;
    }

    await sendLong(
      ctx,
      [
        escapeMarkdown(`Đã resume buổi: ${session.topic ?? "Không có topic"}`),
        escapeMarkdown(formatStagePath(session.currentStage)),
        "",
        openingQuestion(session),
      ].join("\n"),
    );
  });

  bot.command("continue", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    await continueSession(ctx, repo, telegramUserId);
  });

  bot.command("deepen", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    await deepenSession(ctx, repo, telegramUserId);
  });

  bot.command("hint", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;
    await processUserAnswer({
      ctx,
      env,
      repo,
      telegramUserId,
      session,
      message: "Người dùng yêu cầu /hint. Hãy đưa đúng một gợi ý ở mức tiếp theo, không đưa lời giải hoàn chỉnh.",
    });
  });

  bot.command("skip", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;
    const stage = stageAfterSkip(session);
    if (!stage) {
      await repo.updateSession({ sessionId: session.id, status: "completed" });
      await sendLong(ctx, escapeMarkdown("Đã kết thúc buổi. Dùng /summary để xem tổng kết."));
      return;
    }

    await repo.updateSession({
      sessionId: session.id,
      currentStage: stage,
      proposedStage: null,
      hintLevel: 0,
    });
    const updated = await repo.getSessionById(session.id);
    if (updated) await sendLong(ctx, openingQuestion(updated));
  });

  bot.command("back", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;
    const stage = previousStage(session.currentStage);
    if (!stage) {
      await sendLong(ctx, escapeMarkdown("Bạn đang ở stage đầu tiên rồi."));
      return;
    }
    await repo.updateSession({
      sessionId: session.id,
      currentStage: stage,
      proposedStage: null,
      hintLevel: 0,
    });
    const updated = await repo.getSessionById(session.id);
    if (updated) await sendLong(ctx, openingQuestion(updated));
  });

  bot.command("review", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;
    const turns = await repo.getRecentTurns(session.id, 30);
    await sendLong(ctx, escapeMarkdown(renderTurns(turns)));
  });

  bot.command("summary", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const session = await repo.getLatestSession(telegramUserId);
    if (!session) {
      await sendLong(ctx, escapeMarkdown("Chưa có buổi nào để tổng kết."));
      return;
    }
    const turns = await repo.getRecentTurns(session.id, 50);
    await sendLong(
      ctx,
      escapeMarkdown(
        `Topic: ${session.topic ?? "Không có topic"}\nStage hiện tại: ${stageDisplayName(session.currentStage)}\n\nCác câu trả lời đã ghi:\n${renderTurns(turns)}`,
      ),
    );
  });

  bot.command("progress", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const progress = await repo.getProgressSummary(telegramUserId);
    if (progress.length === 0) {
      await sendLong(ctx, escapeMarkdown("Chưa đủ dữ liệu tiến độ. Hãy hoàn thành vài lượt luyện trước."));
      return;
    }

    const body = progress
      .map(
        (item) =>
          `${item.criterion}: mạnh ${item.strengthCount}, cần luyện ${item.practiceCount}. ${item.latestNote}`,
      )
      .join("\n");
    await sendLong(ctx, escapeMarkdown(body));
  });

  bot.command("settings", async (ctx) => {
    await sendLong(
      ctx,
      escapeMarkdown("Hiện hỗ trợ /level beginner|intermediate|advanced. Ngôn ngữ mặc định là tiếng Việt."),
    );
  });

  bot.command("delete", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    await repo.deleteUserHistory(telegramUserId);
    await sendLong(ctx, escapeMarkdown("Đã xoá lịch sử đã lưu của bạn."));
  });

  bot.callbackQuery("continue", async (ctx) => {
    await safeAnswerCallback(ctx);
    await continueSession(ctx, repo, String(ctx.from.id));
  });

  bot.callbackQuery("deepen", async (ctx) => {
    await safeAnswerCallback(ctx);
    await deepenSession(ctx, repo, String(ctx.from.id));
  });

  bot.on("callback_query:data", async (ctx) => {
    await safeAnswerCallback(ctx);
    const data = ctx.callbackQuery.data;
    const telegramUserId = String(ctx.from.id);

    if (data === "new:cancel") {
      await repo.clearFlowState(telegramUserId);
      await sendLong(ctx, escapeMarkdown("Đã hủy tạo buổi mới. Phiên đang có, nếu có, vẫn được giữ nguyên."));
      return;
    }

    if (data === "new:keep") {
      await repo.clearFlowState(telegramUserId);
      const session = await repo.getActiveSession(telegramUserId);
      if (!session) {
        await showNewEntry(ctx, repo, telegramUserId);
        return;
      }
      await sendLong(
        ctx,
        [
          escapeMarkdown(`Tiếp tục phiên: ${session.topic ?? "Không có topic"}`),
          escapeMarkdown(formatStagePath(session.currentStage)),
          "",
          openingQuestion(session),
        ].join("\n"),
      );
      return;
    }

    if (data === "new:replace") {
      const flow = await repo.getFlowState(telegramUserId);
      await repo.pauseActiveSessions(telegramUserId);
      const customTopic =
        typeof flow?.data.customTopic === "string" ? flow.data.customTopic : "";
      if (customTopic) {
        await repo.clearFlowState(telegramUserId);
        const session = await repo.createSession(telegramUserId, customTopic);
        await sendLong(
          ctx,
          [
            `Topic: *${escapeMarkdown(customTopic)}*`,
            escapeMarkdown(formatStagePath(session.currentStage)),
            "",
            openingQuestion(session),
          ].join("\n"),
        );
        return;
      }
      await showNewEntry(ctx, repo, telegramUserId);
      return;
    }

    if (data === "new:choose" || data === "cat:page:0") {
      await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "choose" });
      return;
    }

    if (data === "new:random") {
      await showRandomScope(ctx, repo, telegramUserId);
      return;
    }

    if (data === "rand:all") {
      await startRandomScenario({ ctx, repo, telegramUserId });
      return;
    }

    if (data === "rand:category") {
      await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "random" });
      return;
    }

    if (data === "back:entry") {
      await showNewEntry(ctx, repo, telegramUserId);
      return;
    }

    const categoryPageMatch = /^(cat|rcat):page:(\d+)$/.exec(data);
    if (categoryPageMatch) {
      await showCategoryPage({
        ctx,
        repo,
        telegramUserId,
        page: Number(categoryPageMatch[2] ?? 0),
        mode: categoryPageMatch[1] === "rcat" ? "random" : "choose",
      });
      return;
    }

    const randomCategoryMatch = /^rcat:([a-z0-9-]+)$/.exec(data);
    if (randomCategoryMatch) {
      const categoryId = randomCategoryMatch[1];
      if (!categoryId || !getCategory(categoryId)) {
        await sendLong(ctx, escapeMarkdown("Category này chưa có dữ liệu. Hãy chọn category khác."));
        await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "random" });
        return;
      }
      await startRandomScenario({ ctx, repo, telegramUserId, categoryId });
      return;
    }

    const categoryMatch = /^cat:([a-z0-9-]+)$/.exec(data);
    if (categoryMatch) {
      const category = categoryMatch[1] ? getCategory(categoryMatch[1]) : undefined;
      if (!category || category.keywords.length === 0) {
        await sendLong(ctx, escapeMarkdown("Category này chưa có dữ liệu. Hãy chọn category khác."));
        await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "choose" });
        return;
      }
      await showKeywordList({ ctx, repo, telegramUserId, category });
      return;
    }

    const keywordMatch = /^kw:([a-z0-9-]+):([a-z0-9-]+)$/.exec(data);
    if (keywordMatch) {
      const categoryId = keywordMatch[1] ?? "";
      const keywordId = keywordMatch[2] ?? "";
      const category = getCategory(categoryId);
      const keyword = getKeyword(categoryId, keywordId);
      if (!category || !keyword || keyword.scenarios.length === 0) {
        await sendLong(ctx, escapeMarkdown("Keyword này chưa có scenario. Hãy chọn keyword khác."));
        if (category) await showKeywordList({ ctx, repo, telegramUserId, category });
        else await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "choose" });
        return;
      }
      await showScenarioList({ ctx, repo, telegramUserId, category, keyword, page: 0 });
      return;
    }

    const scenarioPageMatch = /^scpage:([a-z0-9-]+):([a-z0-9-]+):(\d+)$/.exec(data);
    if (scenarioPageMatch) {
      const categoryId = scenarioPageMatch[1] ?? "";
      const keywordId = scenarioPageMatch[2] ?? "";
      const category = getCategory(categoryId);
      const keyword = getKeyword(categoryId, keywordId);
      if (!category || !keyword) {
        await sendLong(ctx, escapeMarkdown("Nút này đã cũ hoặc dữ liệu đã đổi. Hãy bắt đầu lại bằng /new."));
        return;
      }
      await showScenarioList({
        ctx,
        repo,
        telegramUserId,
        category,
        keyword,
        page: Number(scenarioPageMatch[3] ?? 0),
      });
      return;
    }

    const backKeywordMatch = /^back:kw:([a-z0-9-]+)$/.exec(data);
    if (backKeywordMatch) {
      const category = backKeywordMatch[1] ? getCategory(backKeywordMatch[1]) : undefined;
      if (!category) {
        await showCategoryPage({ ctx, repo, telegramUserId, page: 0, mode: "choose" });
        return;
      }
      await showKeywordList({ ctx, repo, telegramUserId, category });
      return;
    }

    const scenarioMatch = /^sc:([a-z0-9-]+):([a-z0-9-]+):([a-z0-9-]+)$/.exec(data);
    if (scenarioMatch) {
      const categoryId = scenarioMatch[1] ?? "";
      const keywordId = scenarioMatch[2] ?? "";
      const scenarioId = scenarioMatch[3] ?? "";
      const category = getCategory(categoryId);
      const keyword = getKeyword(categoryId, keywordId);
      if (!category || !keyword) {
        await sendLong(ctx, escapeMarkdown("Nút này đã cũ hoặc dữ liệu đã đổi. Hãy bắt đầu lại bằng /new."));
        return;
      }
      await startScenario({ ctx, repo, telegramUserId, category, keyword, scenarioId });
      return;
    }

    await sendLong(ctx, escapeMarkdown("Nút này không còn hợp lệ. Dùng /new để mở lại luồng tạo buổi."));
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) {
      await sendLong(ctx, escapeMarkdown("Lệnh chưa hỗ trợ hoặc sai cú pháp. Dùng /help để xem danh sách lệnh."));
      return;
    }

    const telegramUserId = String(ctx.from.id);
    const flow = await repo.getFlowState(telegramUserId);
    if (flow) {
      await sendLong(
        ctx,
        escapeMarkdown("Mình đang chờ bạn chọn bằng nút trong luồng tạo buổi. Mình gửi lại lựa chọn hiện tại nhé."),
      );
      await resendFlowHint(ctx, repo, telegramUserId, flow);
      return;
    }

    const session = await requireSession(ctx, repo, telegramUserId);
    if (!session) return;

    await processUserAnswer({
      ctx,
      env,
      repo,
      telegramUserId,
      session,
      message: text,
    });
  });

  bot.catch((error) => {
    console.error("Bot error", error);
  });

  return bot;
}
