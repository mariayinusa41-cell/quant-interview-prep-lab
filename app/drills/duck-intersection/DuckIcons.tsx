// Hand-drawn pixel icons for the Duck Intersection drill — no emoji.

type PixelGrid = number[][];

function PixelIcon({ grid, colors, className }: { grid: PixelGrid; colors: Record<number, string>; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
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

const ink = "#0b0e13";

// Small duck head silhouette — for the "motion stream" tag.
const DUCK_HEAD_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 2, 2, 2, 1, 0, 0],
  [0, 1, 2, 3, 2, 1, 1, 1],
  [0, 1, 2, 2, 2, 2, 2, 1],
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// 4-quadrant grid — for the "corner math" tag.
const QUADRANT_GRID: PixelGrid = [
  [1, 1, 1, 0, 1, 1, 1, 0],
  [1, 2, 1, 0, 1, 2, 1, 0],
  [1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 0, 1, 1, 1, 0],
  [1, 2, 1, 0, 1, 2, 1, 0],
  [1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Checkered flag — for the "test complete" banner.
const FLAG_GRID: PixelGrid = [
  [1, 1, 0, 0, 1, 1, 0, 0],
  [1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0],
];

export function DuckHeadIcon({ className }: { className?: string }) {
  return <PixelIcon grid={DUCK_HEAD_GRID} colors={{ 1: ink, 2: "#f4c542", 3: ink }} className={className} />;
}
export function QuadrantIcon({ className }: { className?: string }) {
  return <PixelIcon grid={QUADRANT_GRID} colors={{ 1: ink, 2: "#4fb3e0" }} className={className} />;
}
export function FlagIcon({ className }: { className?: string }) {
  return <PixelIcon grid={FLAG_GRID} colors={{ 1: ink, 2: "#8a6a2f" }} className={className} />;
}
