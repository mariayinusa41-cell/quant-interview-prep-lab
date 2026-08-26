import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DarkMode from "../../finance/DarkMode";
import SiteFooter from "../../SiteFooter";
import JobList, { fetchJobs } from "../JobList";
import { FIRMS, firmBySlug } from "../../../lib/jobsDirectory";

type Params = { params: Promise<{ firm: string }> };

// Pre-rendered for all ten firms so a crawler gets HTML immediately rather
// than waiting on a database round trip.
export function generateStaticParams() {
  return FIRMS.map((f) => ({ firm: f.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { firm: slug } = await params;
  const firm = firmBySlug(slug);
  if (!firm) return { title: "Jobs - Outcry" };

  // The title targets what people actually type: the firm name plus the
  // role type, not a branded phrase nobody searches for.
  return {
    title: `${firm.name} Quant Jobs & Internships - Outcry`,
    description: `Current openings at ${firm.name} for quantitative trading, research and developer roles, pulled from their own careers board and refreshed daily.`,
    openGraph: {
      type: "website",
      siteName: "Outcry",
      url: `https://outcryarcade.com/jobs/${firm.slug}`,
      title: `${firm.name} quant jobs and internships`,
      description: `Live openings at ${firm.name}, refreshed daily from their own careers board.`,
      images: ["https://outcryarcade.com/og.png"],
    },
    alternates: { canonical: `https://outcryarcade.com/jobs/${firm.slug}` },
  };
}

export default async function FirmJobsPage({ params }: Params) {
  const { firm: slug } = await params;
  const firm = firmBySlug(slug);
  if (!firm) notFound();

  const jobs = await fetchJobs({ firm: firm.name });
  const byCategory = new Map<string, number>();
  for (const j of jobs) byCategory.set(j.category, (byCategory.get(j.category) ?? 0) + 1);

  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/jobs" className="pirate-back-link">&larr; All firms</a>
        <div className="answer-content news-board">
          <p className="pirate-kicker">Outcry Job Board</p>
          <h1 className="pirate-story-line answer-title">{firm.name} quant jobs</h1>

          <p className="section-intro">{firm.blurb}</p>

          <p className="news-count">
            {jobs.length} open role{jobs.length === 1 ? "" : "s"} listed
            {byCategory.size > 0 && (
              <>
                {" "}&middot;{" "}
                {[...byCategory.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([c, n]) => `${n} ${c}`)
                  .join(", ")}
              </>
            )}
          </p>

          <JobList jobs={jobs} showFirm={false} />

          <section className="section" style={{ marginTop: 26 }}>
            <h2>Preparing for {firm.name}</h2>
            <p className="section-intro">
              Every firm on this board screens on the same handful of skills: fast mental arithmetic, expected value,
              probability under time pressure, and being able to explain your reasoning while someone pushes back.
              Outcry drills those as timed games rather than reading.
            </p>
            <p className="news-count">
              <a href="/drills">Mental math and estimation drills</a> &middot;{" "}
              <a href="/probability">Probability games</a> &middot;{" "}
              <a href="/finance/market-maker">Market making</a>
            </p>
          </section>

          <p className="news-generated">
            Openings come straight from {firm.name}&rsquo;s own careers board and are refreshed daily. Outcry is not
            affiliated with {firm.name} and does not process applications.
          </p>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
