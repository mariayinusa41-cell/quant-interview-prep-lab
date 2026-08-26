import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import SiteFooter from "../SiteFooter";
import { FIRMS, JOB_CATEGORIES } from "../../lib/jobsDirectory";

export const metadata: Metadata = {
  title: "Quant Jobs & Internships at Top Trading Firms - Outcry",
  description:
    "Live quant trading, research and developer openings at Jane Street, IMC, DRW, Jump Trading, WorldQuant, Virtu, Flow Traders and more. Pulled from each firm's own careers board and refreshed daily.",
  openGraph: {
    type: "website",
    siteName: "Outcry",
    url: "https://outcryarcade.com/jobs",
    title: "Quant jobs and internships at top trading firms",
    description: "Live openings from ten quant firms, refreshed daily.",
    images: ["https://outcryarcade.com/og.png"],
  },
  alternates: { canonical: "https://outcryarcade.com/jobs" },
};

export default function JobsIndexPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content news-board">
          <p className="pirate-kicker">Outcry Job Board</p>
          <h1 className="pirate-story-line answer-title">Quant jobs and internships</h1>

          <p className="section-intro">
            Openings at ten quantitative trading firms, taken straight from their own careers boards and refreshed
            every day. Browse by firm or by the kind of seat you want.
          </p>

          <section className="section">
            <h2>By role</h2>
            <div className="skill-domain-grid">
              {JOB_CATEGORIES.map((c) => (
                <a className="skill-domain" key={c.slug} href={`/jobs/roles/${c.slug}`} style={{ textDecoration: "none" }}>
                  <div className="skill-domain-head">
                    <span className="skill-domain-name">{c.label}</span>
                  </div>
                  <p className="track-card-note">{c.blurb}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>By firm</h2>
            <div className="skill-domain-grid">
              {FIRMS.map((f) => (
                <a className="skill-domain" key={f.slug} href={`/jobs/${f.slug}`} style={{ textDecoration: "none" }}>
                  <div className="skill-domain-head">
                    <span className="skill-domain-name">{f.name}</span>
                  </div>
                  <p className="track-card-note">{f.blurb}</p>
                </a>
              ))}
            </div>
          </section>

          <p className="news-generated">
            Outcry is not affiliated with any firm listed here and does not process applications. Every link goes to
            the firm&rsquo;s own posting.
          </p>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
