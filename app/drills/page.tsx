import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import PixelTileIcon from "../PixelTileIcon";
import TokenPlayButton from "../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Drill Lab - Outcry",
  description: "Fast mental-math reps, solo or racing a real recorded run.",
};

const subsections = [
  {
    href: "/drills/arithmetic",
    title: "Arithmetic Drill",
    tag: "Mental math",
    description: "2.5 minutes of addition, subtraction, fractions, division, and decimals. Play solo or race a ghost of a real past run.",
    tone: "blue" as const,
    icon: "calculator" as const,
    gameId: "drills-arithmetic",
    free: false,
  },
  {
    href: "/drills/fermi",
    title: "Fermi Estimation",
    tag: "Order of magnitude",
    description: "Estimate real-world quantities - piano tuners in Chicago, atoms in a body, golf balls in a bus. A quant interview staple.",
    tone: "green" as const,
    icon: "target" as const,
    // Only used as a display key here — the tile is a plain link. The real
    // gate lives inside FermiGame.tsx, split into "drills-fermi-classic"
    // (token-priced) and "drills-fermi-technical" (Infinity Pass only)
    // depending on which mode tab is active.
    gameId: "drills-fermi-classic",
    free: true,
  },
  {
    href: "/drills/sequences",
    title: "Sequence Sprint",
    tag: "Pattern recognition",
    description: "Read the rule hidden in a list of numbers and enter the next value before the pattern slips away.",
    tone: "violet" as const,
    icon: "sequence" as const,
    gameId: "drills-sequence-sprint",
    free: false,
  },
  {
    href: "/drills/survival",
    title: "Dino Dash",
    tag: "Mental math",
    description: "An endless mental-math run - three lives, and the questions get harder the further you get.",
    // Was "drills-sequence-sprint" (a copy/paste leftover) — that made this
    // tile silently free forever AND share Sequence Sprint's session pool.
    // Now its own id, gated for real both here and inside SurvivalDrill.tsx
    // itself (menu button, "Try Again", and the SPACE/canvas-click
    // shortcuts all route through the same access check).
    gameId: "drills-survival-run",
    tone: "amber" as const,
    icon: "dino" as const,
    free: false,
  },
  {
    href: "/drills/probability-ranking",
    title: "Likelihood Ranking",
    tag: "Probability",
    description: "Order students, distributions, and dice/card/urn events from most likely to least likely - the \"which is most likely\" screen question.",
    tone: "cyan" as const,
    icon: "bars" as const,
    gameId: "drills-probability-ranking",
    free: false,
  },
  {
    href: "/drills/duck-intersection",
    title: "Crossroad Multitasker",
    tag: "Task switching",
    description: "A duck at a 4-way crossroad. Track whether it matches the road arrows and whether the live corner's math is even - the question keeps switching on you.",
    tone: "rose" as const,
    icon: "crossroad" as const,
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
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Drill Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Speed reps, not concept reps - the mental math that has to be automatic before an interview starts.
          </p>

          <div className="lab-link-list">
            {subsections.map((s) =>
              s.free ? (
                <a href={s.href} className="lab-link-row" key={s.href}>
                  <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                    <PixelTileIcon kind={s.icon} tone={s.tone} />
                  </span>
                  <span className="teaser-tile-tag">{s.tag}</span>
                  <span className="teaser-tile-title">{s.title}</span>
                  <span className="teaser-tile-desc">{s.description}</span>
                  <span className="teaser-tile-cta">Play &rarr;</span>
                </a>
              ) : (
                <TokenPlayButton gameId={s.gameId} title={s.title} href={s.href} className="lab-link-row" key={s.href}>
                  <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                    <PixelTileIcon kind={s.icon} tone={s.tone} />
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
