import type { TrackId } from "../profile/tracks";

// One entry per lab, shared by the arcade panel and anything else that needs
// the catalogue (search, recommendations) later. `tracks` mirrors the same
// coreSkills mapping tracks.ts already uses for readiness weighting — a lab
// is tagged for a track when it trains at least one of that track's core
// skills, so this stays consistent with what "readiness" already means
// elsewhere on the site rather than being a second, separate opinion.
export const LABS = [
  {
    href: "/brain-teasers",
    tag: "Logic",
    title: "Brain Teasers",
    desc: "Invariants, symmetry, and induction — played out step by step.",
    tone: "blue" as const,
    icon: "target" as const,
    tracks: ["econ-consulting", "quant-trading"] as TrackId[],
  },
  {
    href: "/probability",
    tag: "Probability",
    title: "Quitters Never Lose",
    desc: "Lottery and casino games where the house edge is the lesson.",
    tone: "amber" as const,
    icon: "walk" as const,
    tracks: ["quant-trading", "risk"] as TrackId[],
  },
  {
    href: "/statistics",
    tag: "Statistics",
    title: "Statistics Lab",
    desc: "Signal versus noise, and the multiple-comparisons trap.",
    tone: "blue" as const,
    icon: "bars" as const,
    // Read the Shape (distribution ID, moments, CLT) is core loss-modeling
    // territory, so this also serves actuary even though the other two
    // games (regression, backtests) lean quant-research/econ-consulting.
    tracks: ["quant-research", "econ-consulting", "actuary"] as TrackId[],
  },
  {
    href: "/finance",
    tag: "Finance",
    title: "Finance Lab",
    desc: "Quote a spread, hedge a delta, find out who picked you off.",
    tone: "green" as const,
    icon: "candles" as const,
    tracks: ["quant-trading"] as TrackId[],
  },
  {
    href: "/stochastic-processes",
    tag: "Stochastic",
    title: "Stochastic Processes",
    desc: "Absorbing boundaries, one-step recursions, knowing when to stop.",
    tone: "violet" as const,
    icon: "chart" as const,
    tracks: ["quant-research", "actuary", "risk"] as TrackId[],
  },
  {
    href: "/calculus-linear-algebra",
    tag: "Calculus",
    title: "Gradient Lab",
    desc: "Taylor error, Lagrange constraints, eigenvalues, PSD matrices.",
    tone: "cyan" as const,
    icon: "calculator" as const,
    tracks: ["quant-research", "quant-dev"] as TrackId[],
  },
  {
    href: "/algorithms",
    tag: "Coding",
    title: "Algorithm Arena",
    desc: "Complexity, dynamic programming, and code that actually runs.",
    tone: "blue" as const,
    icon: "sequence" as const,
    tracks: ["quant-dev"] as TrackId[],
  },
  {
    href: "/quantdev",
    tag: "Quant dev",
    title: "Quant Dev Lab",
    desc: "Matching engines, data structures, and code that is timed rather than argued about.",
    tone: "rose" as const,
    icon: "sequence" as const,
    tracks: ["quant-dev"] as TrackId[],
  },
  {
    href: "/risk",
    tag: "Risk",
    title: "Risk Lab",
    desc: "Tail risk, expected shortfall, and correlations that converge when it counts.",
    tone: "amber" as const,
    icon: "bars" as const,
    // VaR/expected shortfall is built directly on loss distributions —
    // the same foundation as actuarial reserving and capital work.
    tracks: ["risk", "actuary"] as TrackId[],
  },
  {
    href: "/econ",
    tag: "Consulting",
    title: "Economic Consulting",
    desc: "Causal inference, damages, and the confounder opposing counsel will find.",
    tone: "green" as const,
    icon: "chart" as const,
    tracks: ["econ-consulting"] as TrackId[],
  },
  {
    href: "/actuarial",
    tag: "Actuarial",
    title: "Actuarial Lab",
    desc: "Run-off triangles, loss development, and reserving that has to hold up.",
    tone: "rose" as const,
    icon: "calculator" as const,
    tracks: ["actuary"] as TrackId[],
  },
  {
    href: "/drills",
    tag: "Speed",
    title: "Drill Lab",
    desc: "Mental math reps until the arithmetic is automatic.",
    tone: "violet" as const,
    icon: "search" as const,
    tracks: ["quant-trading", "econ-consulting"] as TrackId[],
  },
];
