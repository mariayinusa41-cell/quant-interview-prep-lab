"use client";

import { useMemo, useState } from "react";
import rawQuestions from "../../data/interview-questions.json";

// Statically imported, not fetched — this JSON is a build artifact the
// scraper (quant_scraper.py, repo root) regenerates locally, not live user
// data. A runtime `fs.readFile` route (the original draft's approach) would
// work in local dev but breaks once deployed to Cloudflare Workers, which
// has no filesystem at request time. A static import bundles the file at
// build time, so it works identically in dev and in the deployed Worker —
// refreshing the list is "run the scraper, redeploy," same as every other
// piece of generated content on this site.

type InterviewQuestion = {
  id: string;
  source: string;
  sourceUrl: string;
  firm: string;
  category: string;
  title: string;
  rawPrompt: string;
  dateScraped: string;
  score: number;
  verified: boolean;
};

const QUESTIONS = rawQuestions as InterviewQuestion[];

type SortMode = "score" | "recent";

export default function InterviewQuestionsPanel() {
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("score");

  const firms = useMemo(
    () => Array.from(new Set(QUESTIONS.map((q) => q.firm))).sort(),
    []
  );
  const categories = useMemo(
    () => Array.from(new Set(QUESTIONS.map((q) => q.category))).sort(),
    []
  );

  const filtered = useMemo(() => {
    let list = QUESTIONS;
    if (firmFilter !== "all") list = list.filter((q) => q.firm === firmFilter);
    if (categoryFilter !== "all") list = list.filter((q) => q.category === categoryFilter);
    const sorted = [...list];
    if (sortMode === "score") sorted.sort((a, b) => b.score - a.score);
    else sorted.sort((a, b) => (a.dateScraped < b.dateScraped ? 1 : -1));
    return sorted;
  }, [firmFilter, categoryFilter, sortMode]);

  return (
    <div className="hub-panel">
      <section className="section">
        <h2>Interview Questions</h2>
        <p className="section-intro">
          Real questions pulled from public forum threads — Reddit and LeetCode Discuss so far — filtered for
          actual OA/interview reports and tagged by firm and topic.
        </p>

        <div className="iq-disclaimer">
          Community-sourced, not firm-confirmed. Wording, exact numbers, and even the firm attribution can be
          off — treat these as "here's roughly what people are reporting," not a verified question bank. Click
          through to the source thread before trusting any specific detail.
        </div>

        {QUESTIONS.length <= 5 && (
          <div className="iq-disclaimer iq-disclaimer-seed">
            Only {QUESTIONS.length} example entries right now — this is the scraper's seed data, not a live
            scrape. Run <code>python3 quant_scraper.py</code> from the repo root (needs internet access) to pull
            fresh threads into <code>data/interview-questions.json</code>, then redeploy.
          </div>
        )}

        <div className="iq-filters">
          <div className="iq-filter-group">
            <span className="iq-filter-label">Firm</span>
            <div className="lb-tabs iq-chip-row">
              <button
                type="button"
                className={firmFilter === "all" ? "lb-tab is-on" : "lb-tab"}
                onClick={() => setFirmFilter("all")}
              >
                All
              </button>
              {firms.map((firm) => (
                <button
                  key={firm}
                  type="button"
                  className={firmFilter === firm ? "lb-tab is-on" : "lb-tab"}
                  onClick={() => setFirmFilter(firm)}
                >
                  {firm}
                </button>
              ))}
            </div>
          </div>

          <div className="iq-filter-group">
            <span className="iq-filter-label">Category</span>
            <div className="lb-tabs iq-chip-row">
              <button
                type="button"
                className={categoryFilter === "all" ? "lb-tab is-on" : "lb-tab"}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={categoryFilter === cat ? "lb-tab is-on" : "lb-tab"}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="iq-filter-group">
            <span className="iq-filter-label">Sort</span>
            <div className="lb-tabs iq-chip-row">
              <button
                type="button"
                className={sortMode === "score" ? "lb-tab is-on" : "lb-tab"}
                onClick={() => setSortMode("score")}
              >
                Top score
              </button>
              <button
                type="button"
                className={sortMode === "recent" ? "lb-tab is-on" : "lb-tab"}
                onClick={() => setSortMode("recent")}
              >
                Most recent
              </button>
            </div>
          </div>
        </div>

        <p className="iq-count">
          {filtered.length} question{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="news-list">
          {filtered.map((q) => (
            <article className="news-card iq-card" key={q.id}>
              <div className="news-head">
                <span className="news-kind">{q.firm.toUpperCase()}</span>
                <span className="iq-category-tag">{q.category}</span>
                <span className="news-when">{q.dateScraped}</span>
              </div>
              <h3 className="news-title">{q.title}</h3>
              <p className="news-body">{q.rawPrompt}</p>
              <div className="iq-card-footer">
                <span className="iq-source">{q.source}</span>
                <span className={q.verified ? "iq-verified is-verified" : "iq-verified"}>
                  {q.verified ? "Verified" : "Unverified"}
                </span>
                <span className="iq-score">▲ {q.score}</span>
                <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="iq-source-link">
                  Read thread ↗
                </a>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="iq-empty">No questions match this filter combination yet.</p>
          )}
        </div>

        <p className="assess-footnote">
          Sourced from public forum posts by quant_scraper.py — reddit.com and leetcode.com discussion threads,
          filtered by firm name and interview-signal keywords. Not affiliated with or endorsed by any of the
          firms named above.
        </p>
      </section>
    </div>
  );
}
