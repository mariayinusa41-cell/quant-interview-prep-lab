// Pixel-grid icons for the Fermi Estimation game — same blocky technique used
// across the rest of the site (0 = empty, other numbers map to colors).
// No emoji anywhere in this game; every icon here is hand-drawn on an 8x8 grid.

type PixelGrid = number[][];

function PixelIcon({
  grid,
  colors,
  className,
}: {
  grid: PixelGrid;
  colors: Record<number, string>;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 8 8" className={className ?? "fermi-pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {grid.map((row, y) =>
        row.map((code, x) => {
          const fill = colors[code];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const accent = "#47f0c2"; // teal
const accent2 = "#5eb8ff"; // blue
const accent3 = "#b98bff"; // purple
const gold = "#f4c542";
const goldLight = "#ffe28a";
const bad = "#e74c4c";
const ink = "#0b0e13"; // near-black outline, matches PixelIcons.tsx

// ---------- Logo ----------
const TARGET_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 3, 3, 1, 2, 1],
  [1, 2, 1, 3, 3, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

export function TargetIcon({ className }: { className?: string }) {
  return <PixelIcon grid={TARGET_GRID} colors={{ 1: ink, 2: "#f4f0e8", 3: bad }} className={className} />;
}

// ---------- Category icons ----------
const HOUSE_GRID: PixelGrid = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 4, 4, 3, 3, 1],
  [1, 3, 3, 4, 4, 3, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];
export function HouseIcon({ className }: { className?: string }) {
  return <PixelIcon grid={HOUSE_GRID} colors={{ 1: ink, 2: bad, 3: "#f4f0e8", 4: "#8a5a2b" }} className={className} />;
}

const ATOM_GRID: PixelGrid = [
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 2, 2, 2, 2, 0, 0],
  [0, 2, 2, 3, 3, 2, 2, 0],
  [0, 2, 2, 3, 3, 2, 2, 0],
  [0, 0, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
];
export function AtomIcon({ className }: { className?: string }) {
  return <PixelIcon grid={ATOM_GRID} colors={{ 1: accent2, 2: accent3, 3: goldLight }} className={className} />;
}

const GLOBE_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];
export function GlobeIcon({ className }: { className?: string }) {
  return <PixelIcon grid={GLOBE_GRID} colors={{ 1: ink, 2: accent2 }} className={className} />;
}

const MONEYBAG_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 3, 3, 3, 1, 0, 0],
  [0, 1, 3, 3, 3, 1, 0, 0],
  [1, 3, 3, 3, 3, 3, 1, 0],
  [1, 3, 3, 2, 3, 3, 1, 0],
  [1, 3, 2, 2, 2, 3, 1, 0],
  [1, 3, 3, 2, 3, 3, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
];
export function MoneyBagIcon({ className }: { className?: string }) {
  return <PixelIcon grid={MONEYBAG_GRID} colors={{ 1: "#5a3d10", 2: "#2f8a52", 3: gold }} className={className} />;
}

const DNA_GRID: PixelGrid = [
  [1, 0, 0, 0, 0, 0, 0, 2],
  [0, 1, 0, 0, 0, 0, 2, 0],
  [0, 0, 1, 0, 0, 2, 0, 0],
  [0, 0, 0, 1, 2, 0, 0, 0],
  [0, 0, 0, 2, 1, 0, 0, 0],
  [0, 0, 2, 0, 0, 1, 0, 0],
  [0, 2, 0, 0, 0, 0, 1, 0],
  [2, 0, 0, 0, 0, 0, 0, 1],
];
export function DnaIcon({ className }: { className?: string }) {
  return <PixelIcon grid={DNA_GRID} colors={{ 1: accent, 2: accent3 }} className={className} />;
}

// A diagonal wrench reads more clearly than a gear at chip-icon scale (same
// technique as the pencil icon used elsewhere on the site).
const WRENCH_GRID: PixelGrid = [
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 2, 1, 0, 0, 0, 0, 0],
  [0, 1, 2, 1, 0, 0, 0, 0],
  [0, 0, 1, 2, 1, 0, 0, 0],
  [0, 0, 0, 1, 2, 1, 0, 0],
  [0, 0, 0, 0, 1, 2, 1, 1],
  [0, 0, 0, 0, 0, 1, 2, 1],
  [0, 0, 0, 0, 0, 1, 1, 1],
];
export function GearIcon({ className }: { className?: string }) {
  return <PixelIcon grid={WRENCH_GRID} colors={{ 1: ink, 2: accent2 }} className={className} />;
}

// Chip/IC outline with pins on all four sides — for "tech" questions.
const CIRCUIT_GRID: PixelGrid = [
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 1, 0, 1, 0, 1],
];
export function CircuitIcon({ className }: { className?: string }) {
  return <PixelIcon grid={CIRCUIT_GRID} colors={{ 1: ink, 2: accent2, 3: "#0b0e13" }} className={className} />;
}

// A small three-point crown — for "pop-culture" (wealth/fame) questions.
const CROWN_GRID: PixelGrid = [
  [0, 1, 0, 1, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 1, 0],
  [1, 2, 3, 2, 3, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
export function CrownIcon({ className }: { className?: string }) {
  return <PixelIcon grid={CROWN_GRID} colors={{ 1: "#5a3d10", 2: gold, 3: accent3 }} className={className} />;
}

const CATEGORY_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  everyday: HouseIcon,
  physics: AtomIcon,
  geography: GlobeIcon,
  economics: MoneyBagIcon,
  biology: DnaIcon,
  engineering: GearIcon,
  tech: CircuitIcon,
  "pop-culture": CrownIcon,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? TargetIcon;
  return <Icon className={className} />;
}

// ---------- Result icons ----------
const TROPHY_GRID: PixelGrid = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
];
export function TrophyIcon({ className }: { className?: string }) {
  return <PixelIcon grid={TROPHY_GRID} colors={{ 1: "#5a3d10", 2: gold, 3: goldLight }} className={className} />;
}

const CHART_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 0],
  [0, 0, 0, 2, 2, 2, 2, 0],
  [0, 0, 0, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
export function ChartIcon({ className }: { className?: string }) {
  return <PixelIcon grid={CHART_GRID} colors={{ 1: "#f4f0e8", 2: accent }} className={className} />;
}

const RULER_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 1, 2, 1],
  [0, 0, 0, 0, 1, 2, 1, 0],
  [0, 0, 0, 1, 2, 1, 0, 0],
  [0, 0, 1, 2, 1, 0, 0, 0],
  [0, 1, 2, 1, 0, 0, 0, 0],
  [1, 2, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
];
export function RulerIcon({ className }: { className?: string }) {
  return <PixelIcon grid={RULER_GRID} colors={{ 1: "#5a3d10", 2: gold }} className={className} />;
}

export function ResultIcon({ pct, className }: { pct: number; className?: string }) {
  if (pct >= 80) return <TrophyIcon className={className} />;
  if (pct >= 50) return <TargetIcon className={className} />;
  if (pct >= 25) return <ChartIcon className={className} />;
  return <RulerIcon className={className} />;
}

// ---------- Star (difficulty rating) ----------
const STAR_GRID: PixelGrid = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
export function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <PixelIcon
      grid={STAR_GRID}
      colors={{ 1: filled ? accent3 : "rgba(137, 147, 168, 0.35)" }}
      className={className}
    />
  );
}
