import { BotRepository } from "./db";
import { createBot } from "./bot";
import type { Env } from "./types";
import type { Update } from "grammy/types";

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

function homepage(): Response {
  return new Response(
    `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Design Decision Bot</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: Canvas;
        color: CanvasText;
      }
      main {
        width: min(680px, calc(100vw - 40px));
        line-height: 1.55;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 6vw, 4rem);
        letter-spacing: 0;
      }
      p {
        margin: 0 0 14px;
        font-size: 1.05rem;
      }
      code {
        font: 0.95em ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 0.15rem 0.35rem;
        border-radius: 6px;
        background: color-mix(in srgb, CanvasText 10%, Canvas);
      }
      a {
        color: LinkText;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Design Decision Bot</h1>
      <p>Worker đang chạy. Telegram webhook nằm ở <code>/webhook</code> và health check ở <a href="/health"><code>/health</code></a>.</p>
      <p>Mở Telegram bot <a href="https://t.me/DesignDecision_Bot">@DesignDecision_Bot</a> rồi nhắn <code>/start</code> để test.</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
    return unauthorized();
  }

  const update = (await request.json()) as Partial<Update>;
  if (typeof update.update_id !== "number") {
    return new Response("Bad Request", { status: 400 });
  }

  const repo = new BotRepository(env);
  const shouldProcess = await repo.markUpdateProcessing(update.update_id);
  if (!shouldProcess) {
    return new Response("Duplicate update ignored", { status: 200 });
  }

  const bot = createBot(env, repo);
  await bot.init();
  await bot.handleUpdate(update as Update);
  return new Response("OK", { status: 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/") {
      return homepage();
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "design-decision-bot" });
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      return handleWebhook(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
