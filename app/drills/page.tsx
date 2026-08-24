import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import PixelTileIcon from "../PixelTileIcon";
import TokenPlayButton from "../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Drill Lab - Quant Interview Prep Lab",
  description: "Fast mental-math reps, solo or racing a real recorded run.",
};

const subsections = [
  {
    href: "/drills/arithmetic",
    title: "Arithmetic Drill",
    tag: "Mental math",
    description: "2.5 minutes of addition, subtraction, fractions, division, and decimals. Play solo or race a ghost of a real past run.",
    icon: "calculator" as const,
    gameId: "drills-arithmetic",
    free: false,
  },
  {
    href: "/drills/fermi",
    title: "Fermi Estimation",
    tag: "Order of magnitude",
    description: "Estimate real-world quantities — piano tuners in Chicago, atoms in a body, golf balls in a bus. A quant interview staple.",
    icon: "target" as const,
    gameId: "drills-fermi-estimation",
    // Rendered as a plain link, not gated by TokenPlayButton, because Fermi
    // does its own access check per-mode inside the game (classic Fermi vs
    // the Infinity-Pass-gated Technical Estimation mode).
    free: true,
  },
  {
    href: "/drills/sequences",
    title: "Sequence Sprint",
    tag: "Pattern recognition",
    description: "Read the rule hidden in a list of numbers and enter the next value before the pattern slips away.",
    icon: "sequence" as const,
    gameId: "drills-sequence-sprint",
    free: false,
  },
  {
    href: "/drills/survival",
    title: "Survival Run",
    tag: "Mental math",
    // Kept as "drills-sequence-sprint" — that's what it already was (an
    // apparent copy/paste leftover from before this list had a real gameId
    // per entry). Left as-is rather than silently repricing/resplitting an
    // existing paid game's session pool as a side effect of adding an
    // unrelated new drill; worth a deliberate look if you want it split out.
    gameId: "drills-sequence-sprint",
    icon: "target" as const,
    free: false,
  },
  {
    href: "/drills/probability-ranking",
    title: "Likelihood Ranking",
    tag: "Probability",
    description: "Order students, distributions, and dice/card/urn events from most likely to least likely — the \"which is most likely\" screen question.",
    icon: "bars" as const,
    gameId: "drills-probability-ranking",
    free: false,
  },
  {
    href: "/drills/duck-intersection",
    title: "Crossroad Multitasker",
    tag: "Task switching",
    description: "A duck at a 4-way crossroad. Track whether it matches the road arrows and whether the live corner's math is even — the question keeps switching on you.",
    icon: "walk" as const,
    gameId: "drills-duck-intersection",
    free: false,
  },
];

export default function DrillsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Quant Interview Prep Lab</p>
          <h1 className="pirate-story-line teasers-title">Drill Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Speed reps, not concept reps — the mental math that has to be automatic before an interview starts.
          </p>

          <div className="lab-link-list">
            {subsections.map((s) =>
              s.free ? (
                <a href={s.href} className="lab-link-row" key={s.href}>
                  <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                    <PixelTileIcon kind={s.icon} />
                  </span>
                  <span className="teaser-tile-tag">{s.tag}</span>
                  <span className="teaser-tile-title">{s.title}</span>
                  <span className="teaser-tile-desc">{s.description}</span>
                  <span className="teaser-tile-cta">Play &rarr;</span>
                </a>
              ) : (
                <TokenPlayButton gameId={s.gameId} title={s.title} href={s.href} className="lab-link-row" key={s.href}>
                  <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                    <PixelTileIcon kind={s.icon} />
                  </span>
                  <span className="teaser-tile-tag">{s.tag}</span>
                  <span className="teaser-tile-title">{s.title}</span>
                  <span className="teaser-tile-desc">{s.description}</span>
                </TokenPlayButton>
              )
            )}
          </div>
        </div>
      </main>
    </>
  );
}
