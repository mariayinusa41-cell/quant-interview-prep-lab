"use client";

import NewsBoard from "../news/NewsBoard";

// Was a shell with three hard-coded announcements standing in for a feed.
// It now renders the real board: live openings pulled from each firm's own
// careers API by news_scraper.py, industry reading, and hand-written site
// announcements — see app/news/NewsBoard.tsx.
export default function NewsPanel() {
  return (
    <div className="hub-panel">
      <NewsBoard />
    </div>
  );
}
