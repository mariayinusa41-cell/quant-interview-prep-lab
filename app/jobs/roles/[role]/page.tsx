import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DarkMode from "../../../finance/DarkMode";
import SiteFooter from "../../../SiteFooter";
import JobList, { fetchJobs } from "../../JobList";
import { JOB_CATEGORIES, categoryBySlug } from "../../../../lib/jobsDirectory";

type Params = { params: Promise<{ role: string }> };

export function generateStaticParams() {
  return JOB_CATEGORIES.map((c) => ({ role: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { role } = await params;
  const cat = categoryBySlug(role);
  if (!cat) return { title: "Jobs - Outcry" };

  return {
    title: `${cat.label} Jobs at Top Trading Firms - Outcry`,
    description: `${cat.label} openings across Jane Street, IMC, DRW, Jump, WorldQuant and more, pulled from each firm's own careers board and refreshed daily.`,
    openGraph: {
      type: "website",
      siteName: "Outcry",
      url: `https://outcryarcade.com/jobs/roles/${cat.slug}`,
      title: `${cat.label} jobs at quant trading firms`,
      description: cat.blurb,
      images: ["https://outcryarcade.com/og.png"],
    },
    alternates: { canonical: `https://outcryarcade.com/jobs/roles/${cat.slug}` },
  };
}

export default async function RoleJobsPage({ params }: Params) {
  const { role } = await params;
  const cat = categoryBySlug(role);
  if (!cat) notFound();

  const jobs = await fetchJobs({ category: cat.id });
  const firms = new Map<string, number>();
  for (const j of jobs) firms.set(j.source, (firms.get(j.source) ?? 0) + 1);

  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/jobs" className="pirate-back-link">&larr; All roles</a>
        <div className="answer-content news-board">
          <p className="pirate-kicker">Outcry Job Board</p>
          <h1 className="pirate-story-line answer-title">{cat.label} jobs</h1>

          <p className="section-intro">{cat.blurb}</p>
          <p className="news-count">
            {jobs.length} open role{jobs.length === 1 ? "" : "s"} across {firms.size} firm
            {firms.size === 1 ? "" : "s"}
          </p>

          <JobList jobs={jobs} />

          <p className="news-generated">
            Openings come straight from each firm&rsquo;s own careers board and are refreshed daily. Outcry is not
            affiliated with these firms and does not process applications.
          </p>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
