#!/usr/bin/env python3
"""Collect quant job postings and industry reading into data/news.json.

WHY THESE SOURCES

Job boards like LinkedIn and Indeed forbid scraping in their terms and
actively block it, so nothing here touches them. Every firm below publishes
its openings through Greenhouse's public board API, which exists to be read
by third parties and returns clean JSON. Articles come from RSS and a public
search API, which are syndication formats — reading them is their purpose.

Every endpoint was confirmed live before being wired in, the same discipline
quant_scraper.py uses. Firms that turned out NOT to have a public Greenhouse
board (Citadel, Two Sigma, Hudson River Trading) are deliberately absent
rather than left in as tokens that 404 on every run — they use systems with
no public API. Lever was checked for them too and returned nothing.

Run:  python3 news_scraper.py
Then redeploy. This writes a file; it does not run in the request path.
"""

from __future__ import annotations

import html
import json
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, parse, request

OUT = Path(__file__).parent / "data" / "news.json"
UA = "OutcryNewsBot/1.0 (+https://outcryarcade.com)"
TIMEOUT = 20

# Greenhouse board tokens, each verified to return jobs. The label is what
# players see, since a token like "drweng" is not a recognisable firm name.
GREENHOUSE_BOARDS: list[tuple[str, str]] = [
    ("janestreet", "Jane Street"),
    ("imc", "IMC Trading"),
    ("drweng", "DRW"),
    ("jumptrading", "Jump Trading"),
    ("worldquant", "WorldQuant"),
    ("flowtraders", "Flow Traders"),
    ("virtu", "Virtu Financial"),
    ("oldmissioncapital", "Old Mission Capital"),
    ("akunacapital", "Akuna Capital"),
    ("pdtpartners", "PDT Partners"),
]

# Only roles a player of this site would plausibly be preparing for. Without
# a filter these boards are mostly recruiting, IT and facilities postings.
ROLE_PATTERNS = [
    r"\bquant", r"\btrader\b", r"\btrading\b", r"\bresearch(er)?\b",
    r"\bsoftware engineer\b", r"\bdeveloper\b", r"\bmachine learning\b",
    r"\bdata scientist\b", r"\bstrateg(y|ist)\b", r"\brisk\b",
    r"\bactuar", r"\bintern(ship)?\b", r"\bgraduate\b", r"\banalyst\b",
]
ROLE_RE = re.compile("|".join(ROLE_PATTERNS), re.I)

# Buckets so the page can separate "I could apply to this" from "this is
# worth reading". The user asked for these to be separable.
CATEGORIES = {
    "trading": re.compile(r"\btrader\b|\btrading\b", re.I),
    "research": re.compile(r"\bquant|research|machine learning|data scien", re.I),
    "engineering": re.compile(r"software|developer|engineer|infrastructure", re.I),
    "risk": re.compile(r"\brisk\b|actuar|compliance", re.I),
    "internship": re.compile(r"intern|graduate|campus|new grad", re.I),
}


def fetch(url: str, accept: str = "application/json") -> bytes | None:
    req = request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    try:
        with request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.read()
    except (error.URLError, error.HTTPError, TimeoutError, OSError) as exc:
        print(f"  ! {url} -> {exc}")
        return None


def categorise(title: str) -> str:
    """Bucket a role. ORDER MATTERS — these patterns overlap heavily.

    internship first: "Quantitative Trading Intern" is more useful to a
    student under internship than buried among senior trading roles.

    engineering before trading: "Software Engineer - Frontend Trading
    Application" is an engineering job that happens to mention trading, and
    filing it under trading misleads someone browsing for a trading seat.

    trading before research: "Quantitative Trader" contains "quant", which
    the research pattern matches, so research must not get first refusal.
    """
    if CATEGORIES["internship"].search(title):
        return "internship"
    for name in ("engineering", "trading", "research", "risk"):
        if CATEGORIES[name].search(title):
            return name
    return "other"


def collect_jobs() -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for token, firm in GREENHOUSE_BOARDS:
        url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=false"
        raw = fetch(url)
        if raw is None:
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            print(f"  ! {firm}: board returned non-JSON")
            continue

        kept = 0
        for job in payload.get("jobs", []):
            title = (job.get("title") or "").strip()
            if not title or not ROLE_RE.search(title):
                continue
            jobs.append({
                "id": f"gh-{token}-{job.get('id')}",
                "title": normalise_dashes(title),
                "firm": firm,
                "location": normalise_dashes(((job.get("location") or {}).get("name") or "").strip()) or "Unspecified",
                "url": job.get("absolute_url"),
                # Greenhouse gives an ISO timestamp; kept as-is so the UI can
                # sort and show "how new is this" without re-parsing formats.
                "postedAt": job.get("updated_at") or job.get("first_published"),
                "category": categorise(title),
            })
            kept += 1
        print(f"  {firm}: {kept} relevant of {len(payload.get('jobs', []))}")
        time.sleep(0.4)  # be polite to a free public API

    # Newest first, with undated rows last rather than sorted as epoch zero.
    jobs.sort(key=lambda j: j["postedAt"] or "", reverse=True)
    return jobs


def normalise_dashes(s: str) -> str:
    """Firms write titles like "Quant Developer - Equity Options" with an en
    dash. A hyphen means the same thing and keeps the site dash-free without
    altering what the listing says."""
    return re.sub(r"\s*[\u2014\u2013]\s*", " - ", s or "")


def strip_tags(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def clean_abstract(s: str) -> str:
    """Make an arXiv description readable.

    The feed prefixes every abstract with routing boilerplate
    ("arXiv:2608.20589v1 Announce Type: new Abstract:") and leaves LaTeX
    macros in the body, so summaries rendered with literal \cite{...} and
    \emph{...} in them. Both are noise to a reader deciding whether to
    click.
    """
    s = strip_tags(s)
    s = re.sub(r"^arXiv:\S+\s*", "", s)
    s = re.sub(r"Announce Type:\s*\w+\s*", "", s)
    s = re.sub(r"^Abstract:\s*", "", s)
    # \cite{foo}, \emph{bar} -> drop the macro, keep readable content out of
    # the ones that wrap real words.
    s = re.sub(r"\\(?:cite|citep|citet|ref|label)\{[^}]*\}", "", s)
    s = re.sub(r"\\(?:emph|textit|textbf|texttt)\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    s = s.replace("$", "")
    return re.sub(r"\s{2,}", " ", s).strip()


def collect_arxiv(limit: int = 12) -> list[dict[str, Any]]:
    raw = fetch("https://rss.arxiv.org/rss/q-fin", accept="application/rss+xml")
    if raw is None:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        print(f"  ! arXiv: {exc}")
        return []
    out = []
    for item in root.findall(".//item")[:limit]:
        title = strip_tags(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        summary = clean_abstract(item.findtext("description") or "")
        out.append({
            "id": f"arxiv-{link.rsplit('/', 1)[-1]}",
            "title": normalise_dashes(title),
            "url": link,
            "source": "arXiv q-fin",
            "summary": normalise_dashes(summary)[:280],
            "publishedAt": (item.findtext("pubDate") or "").strip(),
            "topic": "research",
        })
    print(f"  arXiv q-fin: {len(out)} papers")
    return out


def collect_hn(queries: list[str], per_query: int = 6) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for q in queries:
        url = (
            "https://hn.algolia.com/api/v1/search_by_date?"
            + parse.urlencode({"query": q, "tags": "story", "hitsPerPage": per_query * 3})
        )
        raw = fetch(url)
        if raw is None:
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        kept = 0
        for hit in payload.get("hits", []):
            link = hit.get("url")
            title = (hit.get("title") or "").strip()
            # Ask/Show HN posts often have no URL; a link with nowhere to go
            # is not worth listing.
            if not link or not title or link in seen:
                continue
            seen.add(link)
            out.append({
                "id": f"hn-{hit.get('objectID')}",
                "title": normalise_dashes(title),
                "url": link,
                "source": "Hacker News",
                "summary": "",
                "publishedAt": hit.get("created_at"),
                "topic": "industry",
                "points": hit.get("points") or 0,
            })
            kept += 1
            if kept >= per_query:
                break
        print(f"  HN '{q}': {kept}")
        time.sleep(0.4)
    return out


def main() -> None:
    print("Collecting jobs...")
    jobs = collect_jobs()
    print("Collecting reading...")
    articles = collect_arxiv() + collect_hn(
        ["quant finance", "quantitative trading", "AI jobs", "hiring market"]
    )
    articles.sort(key=lambda a: a.get("publishedAt") or "", reverse=True)

    by_cat: dict[str, int] = {}
    for j in jobs:
        by_cat[j["category"]] = by_cat.get(j["category"], 0) + 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "jobs": jobs,
        "articles": articles,
        "counts": {"jobs": len(jobs), "articles": len(articles), "byCategory": by_cat},
    }, indent=2) + "\n")

    print(f"\nWrote {OUT}")
    print(f"  {len(jobs)} jobs, {len(articles)} articles")
    print(f"  by category: {by_cat}")


if __name__ == "__main__":
    main()
