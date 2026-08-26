import { sql } from "drizzle-orm";
import { getDb } from "../../db";

// Server-rendered, deliberately.
//
// The hub's news board fetches client-side, which is fine for a logged-in
// player but useless for search: a crawler sees an empty shell. These pages
// exist to be indexed, so the listings have to be in the HTML.

export type JobRow = {
  external_id: string;
  title: string;
  source: string;
  location: string | null;
  category: string;
  url: string;
  posted_at: string | null;
};

export async function fetchJobs(where: { firm?: string; category?: string }): Promise<JobRow[]> {
  try {
    const db = getDb();
    if (where.firm) {
      return (await db.all(sql`
        SELECT external_id, title, source, location, category, url, posted_at
        FROM news_items
        WHERE kind = 'job' AND source = ${where.firm}
        ORDER BY posted_at IS NULL, posted_at DESC
        LIMIT 200
      `)) as unknown as JobRow[];
    }
    if (where.category) {
      return (await db.all(sql`
        SELECT external_id, title, source, location, category, url, posted_at
        FROM news_items
        WHERE kind = 'job' AND category = ${where.category}
        ORDER BY posted_at IS NULL, posted_at DESC
        LIMIT 200
      `)) as unknown as JobRow[];
    }
    return [];
  } catch {
    // An unreachable database should render an empty page, not a 500 that a
    // crawler records as a broken URL.
    return [];
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function JobList({ jobs, showFirm = true }: { jobs: JobRow[]; showFirm?: boolean }) {
  if (jobs.length === 0) {
    return <p className="news-empty">No openings listed right now. The board refreshes daily.</p>;
  }
  return (
    <ul className="news-list">
      {jobs.map((j) => (
        <li key={j.external_id} className="news-row">
          {/* rel includes nofollow: these are third-party listings we do not
              vouch for, and we are not trying to pass ranking signal to
              hundreds of outbound URLs. */}
          <a href={j.url} target="_blank" rel="noopener noreferrer nofollow" className="news-row-link">
            <span className="news-row-title">{j.title}</span>
            <span className="news-row-meta">
              {showFirm && <span className="news-firm">{j.source}</span>}
              <span className="news-loc">{j.location ?? "Unspecified"}</span>
              <span className={`news-cat is-${j.category}`}>{j.category}</span>
              <span className="news-age">{timeAgo(j.posted_at)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
