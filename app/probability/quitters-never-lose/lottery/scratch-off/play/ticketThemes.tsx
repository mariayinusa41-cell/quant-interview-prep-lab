// One themed look per ticket price — same blocky pixel-grid technique used
// for the pirates and tiger sprites elsewhere on the site (0 = empty, other
// numbers map to colors below).

const STAR_GRID = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
];

const CLOVER_GRID = [
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const HORSESHOE_GRID = [
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 1, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const MONEYBAG_GRID = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 2, 2, 2, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
];

const CROWN_GRID = [
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 1, 2, 1, 2, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const DIAMOND_GRID = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 2, 2, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export type TicketTheme = {
  price: number;
  name: string;
  grid: number[][];
  colors: Record<number, string>;
  accent: string;
};

export const TICKET_THEMES: Record<number, TicketTheme> = {
  1: {
    price: 1,
    name: "Lucky Star",
    grid: STAR_GRID,
    colors: { 1: "#f4c542" },
    accent: "#f4c542",
  },
  5: {
    price: 5,
    name: "5 Times Lucky",
    grid: CLOVER_GRID,
    colors: { 1: "#47c26a", 2: "#8a5a2b" },
    accent: "#47c26a",
  },
  10: {
    price: 10,
    name: "Feeling Lucky",
    grid: HORSESHOE_GRID,
    colors: { 1: "#d8ab4e" },
    accent: "#d8ab4e",
  },
  20: {
    price: 20,
    name: "Millionaire Blowout",
    grid: MONEYBAG_GRID,
    colors: { 1: "#3f8f4f", 2: "#f4c542" },
    accent: "#3f8f4f",
  },
  50: {
    price: 50,
    name: "Royal Riches",
    grid: CROWN_GRID,
    colors: { 1: "#f4c542", 2: "#b98bff" },
    accent: "#b98bff",
  },
  100: {
    price: 100,
    name: "Diamond Dazzle",
    grid: DIAMOND_GRID,
    colors: { 1: "#5eb8ff", 2: "#ffffff" },
    accent: "#5eb8ff",
  },
};

export function PixelThemeIcon({ theme, className }: { theme: TicketTheme; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className ?? "pixel-theme-icon"} shapeRendering="crispEdges">
      {theme.grid.map((row, y) =>
        row.map((code, x) => {
          const fill = theme.colors[code];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}
