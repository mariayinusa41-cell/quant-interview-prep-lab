import { env } from "cloudflare:workers";
import { refreshNews } from "../../../../worker/news";

// Manual trigger for the same refresh the daily cron runs.
//
// Exists for two reasons: to force a refresh without waiting for 06:15 UTC,
// and because it is the only practical way to exercise the whole
// fetch-and-upsert path against real D1 — wrangler's --test-scheduled hook
// did not intercept under this app-router setup, so the scheduled handler
// could not be triggered locally.
//
// Guarded by a shared secret rather than a login: this hammers ten
// third-party APIs, so it must not be something a signed-in user can spam.
// With no NEWS_REFRESH_KEY configured the route refuses outright rather
// than defaulting to open.
export async function POST(request: Request) {
  const configured = (env as unknown as { NEWS_REFRESH_KEY?: string }).NEWS_REFRESH_KEY;
  if (!configured) {
    return Response.json(
      { error: "Refresh is not configured. Set the NEWS_REFRESH_KEY secret." },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-refresh-key");
  if (provided !== configured) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) {
    return Response.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    const result = await refreshNews(db);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { error: "Refresh failed.", detail: String(err).slice(0, 300) },
      { status: 500 },
    );
  }
}
