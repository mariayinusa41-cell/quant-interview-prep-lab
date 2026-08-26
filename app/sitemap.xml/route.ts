import { getDb } from "../../db";
import { sql } from "drizzle-orm";
import { STATIC_ROUTES } from "./routes";
import { FIRMS, JOB_CATEGORIES } from "../../lib/jobsDirectory";

// Sitemap.
//
// Generated at request time rather than build time so the job listings the
// daily cron writes are included the day they appear. A static file would
// only ever list what existed at the last deploy, which for a board that
// refreshes daily is the majority of the site's fresh content missing.
//
// Cached for an hour: search engines do not need it fresher than that, and
// it keeps a crawler from running the job query on every hit.

const ORIGIN = "https://outcryarcade.com";

function urlEntry(path: string, changefreq: string, priority: string, lastmod?: string): string {
  return (
    `<url><loc>${ORIGIN}${path}</loc>` +
    (lastmod ? `<lastmod>${lastmod}</lastmod>` : "") +
    `<changefreq>${changefreq}</changefreq>` +
    `<priority>${priority}</priority></url>`
  );
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const parts: string[] = [];

  for (const route of STATIC_ROUTES) {
    parts.push(urlEntry(route.path, route.changefreq, route.priority, today));
  }

  // The programmatic job pages. Listed explicitly because they are dynamic
  // routes and cannot be discovered by walking page.tsx files, and they are
  // the highest-value pages here for search: real openings at named firms,
  // updated daily, which is content nobody else has in this combination.
  for (const firm of FIRMS) {
    parts.push(urlEntry(`/jobs/${firm.slug}`, "daily", "0.9", today));
  }
  for (const cat of JOB_CATEGORIES) {
    parts.push(urlEntry(`/jobs/roles/${cat.slug}`, "daily", "0.9", today));
  }
  parts.push(urlEntry("/jobs", "daily", "0.9", today));

  // The jobs board is the one part of the site that genuinely changes daily,
  // so it gets its own entry with a real lastmod rather than sharing the
  // static list's.
  try {
    const db = getDb();
    const row = (await db.get(sql`
      SELECT MAX(fetched_at) AS latest FROM news_items WHERE kind = 'job'
    `)) as { latest?: string } | undefined;
    if (row?.latest) {
      parts.push(urlEntry("/news", "daily", "0.9", row.latest.slice(0, 10)));
    }
  } catch {
    // No database, no problem: /news is already in STATIC_ROUTES.
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">` +
    parts.join("") +
    `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
