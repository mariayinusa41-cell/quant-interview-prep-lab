/**
 * Daily news refresh, run by a Cloudflare Cron Trigger.
 *
 * This is news_scraper.py ported to the Worker runtime. The Python version
 * still exists for running a refresh by hand, but a cron trigger executes a
 * Worker, so it cannot shell out to Python and cannot write to the repo's
 * static files — the results have to land somewhere the Worker can write,
 * which is D1.
 *
 * Source choices carry over unchanged and for the same reasons: firms'
 * own Greenhouse board APIs rather than scraping LinkedIn or Indeed, which
 * forbid it and block it; RSS and a public search API for reading.
 */

type Row = {
  externalId: string;
  kind: "job" | "article";
  title: string;
  url: string;
  source: string;
  location: string | null;
  category: string;
  summary: string | null;
  postedAt: string | null;
};

const UA = "OutcryNewsBot/1.0 (+https://outcryarcade.com)";

// Verified live before wiring in; firms without a public board API
// (Citadel, Two Sigma, Hudson River Trading) are deliberately absent
// rather than left as tokens that 404 on every run.
const GREENHOUSE_BOARDS: [token: string, firm: string][] = [
  ["janestreet", "Jane Street"],
  ["imc", "IMC Trading"],
  ["drweng", "DRW"],
  ["jumptrading", "Jump Trading"],
  ["worldquant", "WorldQuant"],
  ["flowtraders", "Flow Traders"],
  ["virtu", "Virtu Financial"],
  ["oldmissioncapital", "Old Mission Capital"],
  ["akunacapital", "Akuna Capital"],
  ["pdtpartners", "PDT Partners"],
];

const ROLE_RE =
  /\bquant|\btrader\b|\btrading\b|\bresearch(er)?\b|\bsoftware engineer\b|\bdeveloper\b|\bmachine learning\b|\bdata scientist\b|\bstrateg(y|ist)\b|\brisk\b|\bactuar|\bintern(ship)?\b|\bgraduate\b|\banalyst\b/i;

const CATEGORY_RE = {
  internship: /intern|graduate|campus|new grad/i,
  engineering: /software|developer|engineer|infrastructure/i,
  trading: /\btrader\b|\btrading\b/i,
  research: /\bquant|research|machine learning|data scien/i,
  risk: /\brisk\b|actuar|compliance/i,
};

/**
 * ORDER MATTERS, and it is the same order the Python scraper uses.
 * internship first so a student finds "Quantitative Trading Intern".
 * engineering before trading, or "Software Engineer - Frontend Trading
 * Application" files as a trading seat when it is an engineering job.
 * trading before research, because "Quantitative Trader" contains "quant"
 * and research would otherwise claim it.
 */
function categorise(title: string): string {
  if (CATEGORY_RE.internship.test(title)) return "internship";
  if (CATEGORY_RE.engineering.test(title)) return "engineering";
  if (CATEGORY_RE.trading.test(title)) return "trading";
  if (CATEGORY_RE.research.test(title)) return "research";
  if (CATEGORY_RE.risk.test(title)) return "risk";
  return "other";
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function collectJobs(): Promise<Row[]> {
  const rows: Row[] = [];
  for (const [token, firm] of GREENHOUSE_BOARDS) {
    type GhJob = {
      id: number;
      title: string;
      absolute_url: string;
      updated_at?: string;
      first_published?: string;
      location?: { name?: string };
    };
    const payload = await getJson<{ jobs: GhJob[] }>(
      `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=false`,
    );
    // One firm's board being down must not empty the whole feed, so a null
    // payload skips that firm and leaves its previous rows in place.
    if (!payload?.jobs) continue;

    for (const job of payload.jobs) {
      const title = (job.title ?? "").trim();
      if (!title || !ROLE_RE.test(title)) continue;
      rows.push({
        externalId: `gh-${token}-${job.id}`,
        kind: "job",
        title: normaliseDashes(title),
        url: job.absolute_url,
        source: firm,
        location: normaliseDashes((job.location?.name ?? "").trim()) || "Unspecified",
        category: categorise(title),
        summary: null,
        postedAt: job.updated_at ?? job.first_published ?? null,
      });
    }
  }
  return rows;
}

/**
 * Normalises dashes in third-party text.
 *
 * Firms write job titles like "Quantitative Developer – Equity Options".
 * A hyphen carries the identical meaning, so this keeps the site free of
 * em and en dashes without changing what a listing says.
 */
function normaliseDashes(s: string): string {
  return s.replace(/\s*[—–]\s*/g, " - ");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

/**
 * arXiv descriptions arrive with routing boilerplate
 * ("arXiv:2608.20589v1 Announce Type: new Abstract:") and raw LaTeX macros,
 * both of which render literally on the page.
 */
function cleanAbstract(s: string): string {
  let out = stripTags(s);
  out = out.replace(/^arXiv:\S+\s*/, "");
  out = out.replace(/Announce Type:\s*\w+\s*/, "");
  out = out.replace(/^Abstract:\s*/, "");
  out = out.replace(/\\(?:cite|citep|citet|ref|label)\{[^}]*\}/g, "");
  out = out.replace(/\\(?:emph|textit|textbf|texttt)\{([^}]*)\}/g, "$1");
  out = out.replace(/\\[a-zA-Z]+/g, "");
  out = out.replace(/\$/g, "");
  return out.replace(/\s{2,}/g, " ").trim();
}

/** Minimal RSS <item> pull. Workers have no XML parser, so this is regex. */
function rssItems(xml: string): { title: string; link: string; description: string; pubDate: string }[] {
  const items: { title: string; link: string; description: string; pubDate: string }[] = [];
  const field = (block: string, tag: string) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    if (!m) return "";
    return m[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
  };
  for (const m of xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    items.push({
      title: field(block, "title"),
      link: field(block, "link"),
      description: field(block, "description"),
      pubDate: field(block, "pubDate"),
    });
  }
  return items;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

async function collectArticles(): Promise<Row[]> {
  const rows: Row[] = [];

  try {
    const res = await fetch("https://rss.arxiv.org/rss/q-fin", {
      headers: { "User-Agent": UA, Accept: "application/rss+xml" },
    });
    if (res.ok) {
      const xml = await res.text();
      for (const item of rssItems(xml).slice(0, 12)) {
        const title = decodeEntities(stripTags(item.title));
        if (!title || !item.link) continue;
        rows.push({
          externalId: `arxiv-${item.link.split("/").pop()}`,
          kind: "article",
          title: normaliseDashes(title),
          url: item.link,
          source: "arXiv q-fin",
          location: null,
          category: "research",
          summary: normaliseDashes(decodeEntities(cleanAbstract(item.description))).slice(0, 280),
          postedAt: item.pubDate || null,
        });
      }
    }
  } catch {
    /* leave existing arXiv rows in place */
  }

  type HnHit = { objectID: string; title?: string; url?: string; created_at?: string };
  const seen = new Set<string>();
  for (const q of ["quant finance", "quantitative trading", "AI jobs", "hiring market"]) {
    const payload = await getJson<{ hits: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=18`,
    );
    if (!payload?.hits) continue;
    let kept = 0;
    for (const hit of payload.hits) {
      // Ask/Show HN posts often carry no URL; a link with nowhere to go is
      // not worth listing.
      if (!hit.url || !hit.title || seen.has(hit.url)) continue;
      seen.add(hit.url);
      rows.push({
        externalId: `hn-${hit.objectID}`,
        kind: "article",
        title: normaliseDashes(hit.title.trim()),
        url: hit.url,
        source: "Hacker News",
        location: null,
        category: "industry",
        summary: null,
        postedAt: hit.created_at ?? null,
      });
      if (++kept >= 6) break;
    }
  }

  return rows;
}

export type RefreshResult = { jobs: number; articles: number; written: number };

/** Fetches every source and upserts into D1. Returns what it wrote. */
export async function refreshNews(db: D1Database): Promise<RefreshResult> {
  const jobs = await collectJobs();
  const articles = await collectArticles();
  const all = [...jobs, ...articles];

  let written = 0;
  // D1 batches are capped, so this goes in chunks. ON CONFLICT updates the
  // row in place, keyed on the source's own id, so a daily run refreshes
  // postings instead of duplicating them.
  const CHUNK = 40;
  for (let i = 0; i < all.length; i += CHUNK) {
    const slice = all.slice(i, i + CHUNK);
    const stmts = slice.map((r) =>
      db
        .prepare(
          `INSERT INTO news_items
             (external_id, kind, title, url, source, location, category, summary, posted_at, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(external_id) DO UPDATE SET
             title = excluded.title,
             url = excluded.url,
             source = excluded.source,
             location = excluded.location,
             category = excluded.category,
             summary = excluded.summary,
             posted_at = excluded.posted_at,
             fetched_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          r.externalId, r.kind, r.title, r.url, r.source,
          r.location, r.category, r.summary, r.postedAt,
        ),
    );
    try {
      await db.batch(stmts);
      written += slice.length;
    } catch {
      /* skip this chunk; the rest of the refresh still lands */
    }
  }

  // Drop postings no run has seen for a fortnight — a filled role vanishes
  // from the board rather than lingering forever. Generous enough that one
  // bad fetch cannot wipe a firm's listings.
  try {
    await db
      .prepare(`DELETE FROM news_items WHERE fetched_at < datetime('now', '-14 days')`)
      .run();
  } catch {
    /* pruning is best-effort */
  }

  return { jobs: jobs.length, articles: articles.length, written };
}
