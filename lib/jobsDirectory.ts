// The firm and category pages behind /jobs.
//
// These exist because the job board is the one part of this site with
// content nobody else has in this combination: 600-odd live openings from
// ten named firms, refreshed daily. That is what search engines reward -
// real, specific, current - as opposed to generated articles, which the
// spam updates now actively penalise.
//
// Note what these pages deliberately do NOT do: they carry no JobPosting
// structured data. Google's job markup is meant for the site that actually
// hosts the posting, and claiming to be the source for someone else's
// listing would be misrepresenting whose job it is. These are honest
// directory pages that link out to each firm's own board.

export type FirmEntry = {
  slug: string;
  /** Exactly as stored on the job rows, so lookups match. */
  name: string;
  /** One factual line. No marketing copy about firms we do not represent. */
  blurb: string;
};

export const FIRMS: FirmEntry[] = [
  { slug: "jane-street", name: "Jane Street", blurb: "A quantitative trading firm active across equities, ETFs, bonds, options and currencies, known for OCaml and a strong internship pipeline." },
  { slug: "imc-trading", name: "IMC Trading", blurb: "A market maker founded in Amsterdam, trading on exchanges worldwide with desks in Chicago, Sydney and Mumbai." },
  { slug: "drw", name: "DRW", blurb: "A Chicago-based principal trading firm covering fixed income, energy, crypto and real estate alongside its core trading business." },
  { slug: "jump-trading", name: "Jump Trading", blurb: "A quantitative trading firm known for low-latency infrastructure and research across futures, equities and crypto." },
  { slug: "worldquant", name: "WorldQuant", blurb: "A quantitative asset manager built around systematic alpha research, with a large distributed research network." },
  { slug: "virtu-financial", name: "Virtu Financial", blurb: "A market maker and execution provider quoting across equities, currencies, commodities and fixed income globally." },
  { slug: "flow-traders", name: "Flow Traders", blurb: "A liquidity provider specialising in ETFs, with offices in Amsterdam, New York, Cluj, Hong Kong and Singapore." },
  { slug: "old-mission-capital", name: "Old Mission Capital", blurb: "A Chicago proprietary trading firm making markets in ETFs, equities and options." },
  { slug: "akuna-capital", name: "Akuna Capital", blurb: "A Chicago options market maker with a strong C++ and derivatives-pricing focus." },
  { slug: "pdt-partners", name: "PDT Partners", blurb: "A quantitative investment manager spun out of Morgan Stanley's Process Driven Trading group." },
];

export type CategoryEntry = {
  slug: string;
  /** Matches the `category` column the scraper writes. */
  id: string;
  label: string;
  blurb: string;
};

export const JOB_CATEGORIES: CategoryEntry[] = [
  { slug: "quant-trading", id: "trading", label: "Quant Trading", blurb: "Trader and market-making seats, where the work is pricing and risk under a clock." },
  { slug: "quant-research", id: "research", label: "Quant Research", blurb: "Research and data-science roles built on statistics, signals and modelling." },
  { slug: "quant-developer", id: "engineering", label: "Quant Developer", blurb: "Software and infrastructure roles on trading systems, usually C++ or Python." },
  { slug: "risk", id: "risk", label: "Risk", blurb: "Risk, compliance and actuarial roles across the same firms." },
  { slug: "internships", id: "internship", label: "Internships & Graduate", blurb: "Internships, campus programmes and new-graduate roles - the main entry point into these firms." },
];

export function firmBySlug(slug: string): FirmEntry | undefined {
  return FIRMS.find((f) => f.slug === slug);
}

export function categoryBySlug(slug: string): CategoryEntry | undefined {
  return JOB_CATEGORIES.find((c) => c.slug === slug);
}
