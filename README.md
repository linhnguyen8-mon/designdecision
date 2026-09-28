# Design Decision Bot

Telegram bot MVP for coaching product design thinking. It runs on Cloudflare Workers, stores progress in D1, and uses Gemini through a small wrapper so the model/API can be changed later.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.dev.vars.example` to `.dev.vars` and fill in:

   - `BOT_TOKEN`
   - `WEBHOOK_SECRET`
   - `GEMINI_API_KEY`
   - `ALLOWED_TELEGRAM_USER_IDS`

3. Create D1 and update `wrangler.toml`:

   ```bash
   wrangler d1 create design_decision_bot
   ```

4. Apply schema:

   ```bash
   pnpm db:migrate:local
   pnpm db:migrate:remote
   ```

5. Run locally:

   ```bash
   pnpm dev
   ```

## Deploy

Set secrets:

```bash
wrangler secret put BOT_TOKEN
wrangler secret put WEBHOOK_SECRET
wrangler secret put GEMINI_API_KEY
```

Deploy:

```bash
pnpm deploy
```

Set the Telegram webhook:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_WORKER_URL/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```

## Commands

`/start`, `/new`, `/topic`, `/level`, `/resume`, `/pause`, `/continue`, `/deepen`, `/hint`, `/skip`, `/back`, `/review`, `/summary`, `/progress`, `/settings`, `/delete`, `/help`.

## `/new` Scenario Flow

`/new` opens a guided setup instead of immediately creating a random topic:

1. Choose `Chọn lĩnh vực` or `Scenario ngẫu nhiên`.
2. If choosing a category, pick from the full category list, then a keyword, then a concrete scenario.
3. If choosing random, pick `Toàn thư viện` or choose one category as the random scope.
4. The selected scenario starts at `Frame` and the coach focuses on behavior, psychology, hypotheses, product metrics, validation, solution impact, and guardrails.

If `/new` is sent during an active session, the bot asks whether to continue the current session or start a new one. Selection state is saved in D1 so stray text, back buttons, old buttons, and cancel actions do not lose the current session.

## Manual Check

- `/new` with no active session: choose category from the full list → keyword → scenario.
- `/new` then `Scenario ngẫu nhiên` → `Toàn thư viện`.
- `/new` then `Scenario ngẫu nhiên` → choose category.
- Send ordinary text while in the selection flow; the bot should resend the current menu.
- Send `/new` while a session is active; verify continue vs start-new choices.
- Pick `/continue` only after the coach proposes a stage transition.
