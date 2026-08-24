#!/usr/bin/env python3
"""Collect and normalize high-signal interview questions into a JSON file.

Rewritten from the original draft, which used two endpoints that no longer
work as written:
  - Reddit's `/search.json` endpoint now 403s on unauthenticated requests
    (verified with a live curl before rewriting this, not assumed) — its
    public Atom RSS search feed (`/search.rss`) still returns 200 with real
    entries, so this version uses that instead.
  - LeetCode's GraphQL `topicSearch` field doesn't exist in the current
    schema (`Cannot query field "topicSearch"`) — the current query is
    `categoryTopicList(categories: [...], ...)` plus a per-topic `topic(id)`
    query for the post body, both confirmed working live before wiring in.
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

TARGET_FIRMS = [
    "Optiver",
    "Jane Street",
    "Citadel",
    "Hudson River Trading",
    "HRT",
    "SIG",
    "Susquehanna",
    "Flow Traders",
    "IMC",
    "Akuna",
    "Two Sigma",
    "Five Rings",
    "Jump Trading",
    "Da Vinci",
    "Maven Securities",
    "DRW",
    "Tower Research",
    "Millennium",
    "Point72",
    "Cornerstone Research",
    "Analysis Group",
]

SIGNAL_KEYWORDS = [
    "OA",
    "online assessment",
    "interview question",
    "interview experience",
    "brainteaser",
    "expected value",
    "probability",
    "market making",
    "dice",
    "80 in 8",
    "mental math",
    "coin flip",
    "betting game",
    "stochastic",
    "martingale",
    "difference in differences",
    "chain ladder",
    "hackerrank",
    "codesignal",
    "superday",
    "phone screen",
    "technical screen",
    "case interview",
]

NOISE_KEYWORDS = [
    "resume review",
    "salary negotiation",
    "comp review",
    "is this offer good",
    "referral",
    "wlb",
    "internship housing",
    "dress code",
]

DATA_PATH = Path(__file__).resolve().parent / "data" / "interview-questions.json"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) QuantPrepLab/1.0 (personal study tool)"
MAX_PROMPT_CHARS = 4000  # long interview-experience writeups get truncated, not cut mid-word beyond this


def load_existing() -> list[dict[str, Any]]:
    if DATA_PATH.exists():
        try:
            with DATA_PATH.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            if isinstance(payload, list):
                return payload
        except (json.JSONDecodeError, OSError):
            pass
    return []


def write_output(entries: list[dict[str, Any]]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("w", encoding="utf-8") as handle:
        json.dump(entries, handle, indent=2)
        handle.write("\n")


# Word-boundary matching, not naive substring `in` — a plain substring check
# on a 3-letter abbreviation like "SIG" matches inside "design", "LLD",
# "significant", "assigned", tagging every unrelated post as Susquehanna.
# Confirmed live: an initial run mislabeled Amazon/Apple/LinkedIn/Nutanix
# SWE-interview posts as SIG for exactly this reason before this was added.
def _firm_pattern(firm: str) -> re.Pattern[str]:
    return re.compile(r"\b" + re.escape(firm.lower()) + r"\b")


_FIRM_PATTERNS = [(firm, _firm_pattern(firm)) for firm in TARGET_FIRMS]


def is_high_signal(title: str, body: str) -> bool:
    text = f"{title} {body}".lower()
    if any(noise in text for noise in NOISE_KEYWORDS):
        return False
    has_signal = any(keyword.lower() in text for keyword in SIGNAL_KEYWORDS)
    has_firm = any(pattern.search(text) for _, pattern in _FIRM_PATTERNS)
    return has_signal and has_firm


def detect_firm(text: str) -> str:
    text_lower = text.lower()
    for firm, pattern in _FIRM_PATTERNS:
        if pattern.search(text_lower):
            if firm.upper() == "HRT":
                return "Hudson River Trading"
            if firm.upper() == "SIG":
                return "Susquehanna (SIG)"
            return firm
    return "General Quant"


def detect_category(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["dice", "coin", "probability", "expected value", " ev "]):
        return "Probability & EV"
    if any(k in text_lower for k in ["market making", "bid", "ask", "spread", "arbitrage"]):
        return "Market Making"
    if any(k in text_lower for k in ["80 in 8", "arithmetic", "mental math", "sequence"]):
        return "Mental Math / OA Sprint"
    if any(k in text_lower for k in ["hackerrank", "codesignal", "dijkstra", "lru", " dp ", "complexity", "leetcode"]):
        return "Quant Developer / Coding"
    if any(k in text_lower for k in ["diff in diff", "hhi", "elasticity", "cornerstone"]):
        return "Economic Consulting"
    if any(k in text_lower for k in ["chain ladder", "loss triangle", "mortality", "actuary", "actuarial"]):
        return "Actuarial Science"
    return "Brainteaser / Logic"


def strip_html(raw: str) -> str:
    # Reddit's RSS <content> field is HTML. Good enough for forum-post
    # markup (no script/style blocks to worry about here): strip tags,
    # unescape entities, collapse whitespace.
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def truncate(text: str, limit: int = MAX_PROMPT_CHARS) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


# ---------------------------------------------------------------------------
# Question extraction — a long forum post ("I clarified requirements, then
# walked through a test case, then...") is not what belongs in the app.
# This deliberately does NOT try to lift and trim sentences out of someone
# else's writeup — a first version did that and it kept snagging narrative
# ("The interviewer seemed pleased...") that happened to end in a question
# mark, which is both low quality and closer to reproducing their prose than
# this should get. Instead it only keeps short, generic technical labels —
# problem names like "Kth Largest Element in an Array" are standard CS/quant
# terminology, not the original author's expression — and turns each into a
# fresh, plainly-worded prompt in the app's own house style. Anything with no
# such label is dropped rather than shown as a mangled narrative fragment.
# ---------------------------------------------------------------------------

# Bolded/numbered headers that introduce a distinct question inside a longer
# writeup: "**Question 1: Kth Largest Element**", "Q2)", "Round 1 - ...".
_HEADER_PATTERN = re.compile(
    r"(?:^|\n)\s*\**\s*(?:Q(?:uestion)?\s*\d*|Round\s*\d+)\s*\**\s*[:.\-)]\s*\**\s*([^\n]{4,140})",
    re.IGNORECASE,
)

# A short, self-contained question the OP wrote as an actual question (ends
# in "?", no more than ~140 chars so it can't smuggle in a whole paragraph of
# their narrative) — used only for posts with no bolded headers at all.
_SHORT_QUESTION_SENTENCE = re.compile(r"([A-Z][^.!?\n]{15,140}\?)")


def extract_questions(title: str, body: str) -> list[dict[str, str]]:
    """Splits a scraped post into distinct {title, prompt} question entries.
    `title` here is a short technical label (safe to reuse verbatim — it's a
    generic problem name, not creative prose); `prompt` is written fresh
    rather than lifted from the source. Returns [] when nothing label-like
    was found, so the post is skipped rather than shown half-narrative.
    """
    out: list[dict[str, str]] = []
    for m in _HEADER_PATTERN.finditer(body):
        raw_label = m.group(1).strip().strip("*").strip()
        # Stop at the first sentence break — titles are declarative
        # ("Kth Largest Element in an Array"); anything after the first
        # period is narrative continuation ("...variant. Instead of a
        # binary array input is..."), not part of the label.
        label = re.split(r"[.!?]\s|\.$", raw_label, maxsplit=1)[0].rstrip(":.-").strip()
        if label and 4 <= len(label) <= 90:
            out.append({"title": label, "prompt": f"Reported technical-round question: {label}."})
    if out:
        return out

    qmatch = _SHORT_QUESTION_SENTENCE.search(body)
    if qmatch and not _is_meta_question(qmatch.group(1)):
        q = qmatch.group(1).strip()
        return [{"title": title, "prompt": q}]
    if title.strip().endswith("?") and len(title.strip()) <= 160 and not _is_meta_question(title):
        return [{"title": title, "prompt": title.strip()}]
    return []


# "Anyone take the SIG OA?", "Did anyone get an interview yet?" — thread
# titles that are the OP asking the SUBREDDIT something, not a technical
# question a candidate was actually asked. These aren't practice material,
# so they're rejected rather than shown as if they were a real prompt.
_META_QUESTION = re.compile(
    r"\b(anyone|anybody|does\s+anyone|did\s+anyone|has\s+anyone|any\s+tips|any\s+advice|"
    r"any\s+idea|worth\s+it|good\s+offer|which\s+offer|should\s+i|thoughts\s+on|"
    r"how\s+(hard|long|many)\s+.*(take|is|was)|got\s+(an?\s+)?(interview|offer))\b",
    re.IGNORECASE,
)


def _is_meta_question(text: str) -> bool:
    return bool(_META_QUESTION.search(text))


def fetch(url: str, *, method: str = "GET", data: bytes | None = None, headers: dict[str, str] | None = None) -> bytes:
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = request.Request(url, data=data, headers=req_headers, method=method)
    with request.urlopen(req, timeout=10) as response:
        return response.read()


def scrape_reddit(subreddits: list[str] | None = None, queries: list[str] | None = None) -> list[dict[str, Any]]:
    existing = load_existing()
    existing_urls = {q.get("sourceUrl") for q in existing}
    subreddits = subreddits or ["quant", "FinancialCareers", "leetcode", "csMajors"]
    queries = queries or ["OA", "interview", "Optiver", "Jane Street", "Citadel", "Flow Traders", "SIG", "Akuna", "HRT"]
    results: list[dict[str, Any]] = []
    ns = {"a": "http://www.w3.org/2005/Atom"}

    for sub in subreddits:
        for q in queries:
            encoded = parse.quote(q)
            url = f"https://www.reddit.com/r/{sub}/search.rss?q={encoded}&restrict_sr=1&sort=relevance&limit=25"
            try:
                raw = fetch(url)
                root = ET.fromstring(raw)
            except (error.URLError, TimeoutError, ET.ParseError, OSError):
                continue

            for entry in root.findall("a:entry", ns):
                title_el = entry.find("a:title", ns)
                content_el = entry.find("a:content", ns)
                link_el = entry.find("a:link", ns)
                published_el = entry.find("a:published", ns)
                id_el = entry.find("a:id", ns)
                if title_el is None or link_el is None:
                    continue

                title = title_el.text or ""
                body_html = content_el.text or "" if content_el is not None else ""
                body = strip_html(body_html)
                source_url = link_el.attrib.get("href", "")
                if not source_url or source_url in existing_urls:
                    continue
                if not is_high_signal(title, body):
                    continue

                published = (published_el.text if published_el is not None else "") or ""
                date_str = published[:10] if published else datetime.now(timezone.utc).strftime("%Y-%m-%d")

                combined_text = f"{title}\n\n{body}".strip()
                entry_id = (id_el.text if id_el is not None else "") or source_url
                base_id = re.sub(r"[^a-zA-Z0-9]+", "-", entry_id)[-40:]

                # Distill to distinct questions and throw away the
                # surrounding narrative — a post with no question-shaped
                # text in it contributes nothing and is skipped entirely.
                questions = extract_questions(title, body)
                combined_meta_text = f"{title}\n\n{body}"
                for i, q in enumerate(questions):
                    results.append(
                        {
                            "id": f"reddit-{base_id}" + (f"-{i}" if len(questions) > 1 else ""),
                            "source": f"Reddit (r/{sub})",
                            "sourceUrl": source_url,
                            "firm": detect_firm(combined_meta_text),
                            "category": detect_category(combined_meta_text),
                            "title": q["title"],
                            "rawPrompt": q["prompt"],
                            "dateScraped": date_str,
                            "score": 0,  # RSS doesn't expose vote score
                            "verified": False,
                        }
                    )
                existing_urls.add(source_url)
            time.sleep(0.4)  # be polite — this is a public feed, not an API key
    return results


def scrape_leetcode_discuss(categories: list[str] | None = None, pages: int = 3) -> list[dict[str, Any]]:
    existing = load_existing()
    existing_urls = {q.get("sourceUrl") for q in existing}
    categories = categories or ["interview-experience", "interview-question"]
    results: list[dict[str, Any]] = []

    for category in categories:
        for page in range(pages):
            list_query = {
                "query": (
                    "query($categories: [String!], $orderBy: TopicSortingOption, "
                    "$skip: Int, $first: Int) { categoryTopicList(categories: $categories, "
                    "orderBy: $orderBy, skip: $skip, first: $first) { edges { node { id title } } } }"
                ),
                "variables": {"categories": [category], "orderBy": "hot", "skip": page * 20, "first": 20},
            }
            try:
                raw = fetch(
                    "https://leetcode.com/graphql",
                    method="POST",
                    data=json.dumps(list_query).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                payload = json.loads(raw)
            except (error.URLError, TimeoutError, ValueError, OSError):
                continue

            edges = payload.get("data", {}).get("categoryTopicList", {}).get("edges", [])
            if not edges:
                break

            for edge in edges:
                node = edge.get("node", {})
                topic_id = node.get("id")
                title = node.get("title", "")
                if not topic_id:
                    continue
                source_url = f"https://leetcode.com/discuss/post/{topic_id}/"
                if source_url in existing_urls:
                    continue
                # No title-only pre-filter here — the category is already
                # scoped to interview-experience writeups, and titles alone
                # ("E4 Interview Experience (REJECT)") rarely name both a
                # firm and a signal keyword the way a Reddit post title
                # does. The real filter runs on title+body once fetched.
                detail_query = {
                    "query": "query($id: Int!) { topic(id: $id) { post { content voteCount creationDate } } }",
                    "variables": {"id": int(topic_id)},
                }
                try:
                    detail_raw = fetch(
                        "https://leetcode.com/graphql",
                        method="POST",
                        data=json.dumps(detail_query).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                    )
                    detail = json.loads(detail_raw)
                except (error.URLError, TimeoutError, ValueError, OSError):
                    continue

                post = detail.get("data", {}).get("topic", {}).get("post") or {}
                content = post.get("content", "") or ""
                combined_text = f"{title}\n\n{content}".strip()
                if not is_high_signal(title, content):
                    continue

                creation = post.get("creationDate")
                date_str = (
                    datetime.fromtimestamp(creation, tz=timezone.utc).strftime("%Y-%m-%d")
                    if creation
                    else datetime.now(timezone.utc).strftime("%Y-%m-%d")
                )

                questions = extract_questions(title, content)
                vote_count = int(post.get("voteCount") or 0)
                for i, q in enumerate(questions):
                    results.append(
                        {
                            "id": f"leetcode-{topic_id}" + (f"-{i}" if len(questions) > 1 else ""),
                            "source": "LeetCode Discuss",
                            "sourceUrl": source_url,
                            "firm": detect_firm(combined_text),
                            "category": detect_category(combined_text),
                            "title": q["title"],
                            "rawPrompt": q["prompt"],
                            "dateScraped": date_str,
                            "score": vote_count,
                            "verified": False,
                        }
                    )
                existing_urls.add(source_url)
                time.sleep(0.3)
    return results


def main() -> None:
    questions = load_existing()
    # Keyed by id, not sourceUrl — one post can now split into several
    # distinct extracted questions sharing a source but with distinct ids.
    unique_by_id: dict[str, dict[str, Any]] = {q.get("id"): q for q in questions if q.get("id")}

    reddit_results = scrape_reddit()
    print(f"Reddit: {len(reddit_results)} extracted questions")
    for entry in reddit_results:
        unique_by_id[entry["id"]] = entry

    leetcode_results = scrape_leetcode_discuss()
    print(f"LeetCode: {len(leetcode_results)} extracted questions")
    for entry in leetcode_results:
        unique_by_id[entry["id"]] = entry

    ordered = sorted(unique_by_id.values(), key=lambda item: item.get("dateScraped", "1970-01-01"), reverse=True)
    write_output(ordered)
    print(f"Wrote {len(ordered)} total interview questions to {DATA_PATH}")


if __name__ == "__main__":
    main()
