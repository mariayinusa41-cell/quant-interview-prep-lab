// Hand-drawn pixel icons for each commodity — no emoji anywhere in this
// game. Same 8x8 blocky-grid technique used across the rest of the site
// (0 = empty, other numbers map to colors), shape-differentiated (not just
// color) so they read clearly even in grayscale.

import type { CommodityType } from "./basketTypes";

type PixelGrid = number[][];

function PixelIcon({ grid, colors, className }: { grid: PixelGrid; colors: Record<number, string>; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className ?? "commodity-icon"} shapeRendering="crispEdges" aria-hidden="true">
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

// Gold — a stacked bar, viewed at an angle (trapezoid-ish blocks).
const GOLD_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 3, 3, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Silver — a coin stack (circles), distinct silhouette from gold's bar.
const SILVER_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Platinum — a faceted gem (diamond), distinct from both metals-bar shapes.
const PLATINUM_GRID: PixelGrid = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [0, 1, 2, 3, 3, 2, 1, 0],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Copper — a coil (spiral-ish rings), distinct from the coin/bar/gem shapes.
const COPPER_GRID: PixelGrid = [
  [0, 1, 1, 1, 1, 1, 0, 0],
  [1, 2, 2, 2, 2, 1, 1, 0],
  [1, 2, 0, 0, 2, 1, 0, 0],
  [1, 2, 0, 0, 2, 1, 1, 0],
  [1, 2, 2, 2, 2, 1, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Oil — a barrel, distinct silhouette from all the metal shapes.
const OIL_GRID: PixelGrid = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const COMMODITY_ICON_DATA: Record<CommodityType, { grid: PixelGrid; colors: Record<number, string> }> = {
  gold: { grid: GOLD_GRID, colors: { 1: ink, 2: "#f4c542", 3: "#ffe28a" } },
  silver: { grid: SILVER_GRID, colors: { 1: ink, 2: "#d7dee6" } },
  platinum: { grid: PLATINUM_GRID, colors: { 1: ink, 2: "#8fd8ff", 3: "#e4f6ff" } },
  copper: { grid: COPPER_GRID, colors: { 1: ink, 2: "#e0793f" } },
  oil: { grid: OIL_GRID, colors: { 1: ink, 2: "#2b2f3a" } },
};

export function CommodityIcon({ commodity, className }: { commodity: CommodityType; className?: string }) {
  const data = COMMODITY_ICON_DATA[commodity];
  return <PixelIcon grid={data.grid} colors={data.colors} className={className} />;
}
