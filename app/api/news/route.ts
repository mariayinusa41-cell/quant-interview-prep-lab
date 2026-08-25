import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

// Serves whatever the daily cron last wrote (see worker/news.ts).
//
// Returns an empty payload rather than an error when the table is missing
// or the cron has never run, because the client falls back to the bundled
// data/news.json in that case — a first deploy, or a D1 hiccup, should show
// the last built-in snapshot rather than an error page.

type ItemRow = {
  external_id: string;
  kind: string;
  title: string;
  url: string;
  source: string;
  location: string | null;
  category: string;
  summary: string | null;
  posted_at: string | null;
  fetched_at: string;
};

export async function GET() {
  try {
    const db = getDb();
    const rows = (await db.all(sql`
      SELECT external_id, kind, title, url, source, location, category, summary, posted_at, fetched_at
      FROM news_items
      ORDER BY posted_at IS NULL, posted_at DESC
      LIMIT 800
    `)) as unknown as ItemRow[];

    if (!rows.length) {
      return Response.json({ generatedAt: null, jobs: [], articles: [], stale: true });
    }

    const jobs = rows
      .filter((r) => r.kind === "job")
      .map((r) => ({
        id: r.external_id,
        title: r.title,
        firm: r.source,
        location: r.location ?? "Unspecified",
        url: r.url,
        postedAt: r.posted_at,
        category: r.category,
      }));

    const articles = rows
      .filter((r) => r.kind === "article")
      .map((r) => ({
        id: r.external_id,
        title: r.title,
        url: r.url,
        source: r.source,
        summary: r.summary ?? "",
        publishedAt: r.posted_at,
        topic: r.category,
      }));

    // The newest fetch stamp is when the cron last succeeded, which is what
    // "last refreshed" on the page should mean.
    const generatedAt = rows.reduce(
      (latest, r) => (r.fetched_at > latest ? r.fetched_at : latest),
      rows[0].fetched_at,
    );

    return Response.json({ generatedAt, jobs, articles, stale: false });
  } catch {
    return Response.json({ generatedAt: null, jobs: [], articles: [], stale: true });
  }
}
