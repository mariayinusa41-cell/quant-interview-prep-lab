// Pixel-grid icons for the Quitters Never Lose flow — same blocky technique
// as the scratch-off ticket themes (0 = empty, other numbers map to colors).
// No emoji anywhere in this flow; every icon here is hand-drawn on an 8x8 grid.

export type PixelGrid = number[][];

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

const TICKET_GRID: PixelGrid = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 2, 0, 1],
  [1, 0, 0, 2, 2, 0, 0, 1],
  [1, 0, 0, 2, 2, 0, 0, 1],
  [1, 0, 2, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
];

const CARDS_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 0, 2, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 2, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

const BALL_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

const CLOCK_GRID: PixelGrid = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 2, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 0, 1],
  [1, 0, 0, 2, 2, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

const PENCIL_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 0, 0],
  [1, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const accent = "#47f0c2";
const accent2 = "#5eb8ff";
const accent3 = "#b98bff";
const gold = "#f4c542";

export function TicketIcon({ className }: { className?: string }) {
  return <PixelIcon grid={TICKET_GRID} colors={{ 1: gold, 2: "#0b0e13" }} className={className} />;
}

export function CardsIcon({ className }: { className?: string }) {
  const pixels: { x: number; y: number; fill: string }[] = [];
  const add = (x: number, y: number, width: number, height: number, fill: string) => {
    for (let dy = 0; dy < height; dy += 1) {
      for (let dx = 0; dx < width; dx += 1) pixels.push({ x: x + dx, y: y + dy, fill });
    }
  };

  add(2, 1, 8, 12, accent3);
  add(3, 2, 6, 10, "#0b0e13");
  add(5, 3, 9, 12, accent2);
  add(6, 4, 7, 10, "#0b0e13");
  add(8, 6, 3, 3, gold);
  add(9, 7, 1, 1, "#0b0e13");

  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export function CherrySlotIcon({ className }: { className?: string }) {
  const pixels: { x: number; y: number; fill: string }[] = [];
  const add = (x: number, y: number, width: number, height: number, fill: string) => {
    for (let dy = 0; dy < height; dy += 1) {
      for (let dx = 0; dx < width; dx += 1) pixels.push({ x: x + dx, y: y + dy, fill });
    }
  };

  const gold = "#f4c542";
  const blue = "#5eb8ff";
  const red = "#e74c4c";
  const green = "#59c98f";
  const dark = "#0b0e13";

  add(2, 1, 11, 1, gold);
  add(1, 2, 1, 11, gold);
  add(13, 2, 1, 11, gold);
  add(2, 13, 11, 2, gold);
  add(3, 3, 9, 6, blue);
  add(4, 4, 2, 4, dark);
  add(7, 4, 2, 4, dark);
  add(10, 4, 1, 4, dark);
  add(4, 9, 8, 2, red);
  add(5, 10, 2, 1, gold);
  add(9, 10, 2, 1, gold);
  add(5, 5, 1, 1, green);
  add(8, 5, 1, 1, green);
  add(4, 6, 2, 2, red);
  add(7, 6, 2, 2, red);
  add(10, 6, 1, 2, red);
  add(5, 4, 1, 2, green);
  add(8, 4, 1, 2, green);
  add(13, 5, 2, 2, gold);
  add(14, 7, 1, 4, gold);
  add(13, 10, 2, 1, gold);

  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export function RouletteIcon({ className }: { className?: string }) {
  const pixels: { x: number; y: number; fill: string }[] = [];
  const center = 7.5;

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (distance <= 7.2) {
        const angle = Math.atan2(y - center, x - center);
        const sector = Math.floor(((angle + Math.PI) / (Math.PI / 4)) % 8);
        const fill = distance > 5.8 ? "#f4c542" : sector % 2 === 0 ? "#e74c4c" : "#f4f0e8";
        pixels.push({ x, y, fill });
      }
    }
  }

  for (let y = 5; y < 11; y += 1) {
    for (let x = 5; x < 11; x += 1) {
      if (Math.sqrt((x - center) ** 2 + (y - center) ** 2) <= 3) {
        pixels.push({ x, y, fill: "#0b0e13" });
      }
    }
  }
  pixels.push({ x: 7, y: 7, fill: "#f4c542" }, { x: 8, y: 7, fill: "#f4c542" }, { x: 7, y: 8, fill: "#f4c542" }, { x: 8, y: 8, fill: "#f4c542" });
  [[12, 2], [13, 2], [13, 3]].forEach(([x, y]) => pixels.push({ x, y, fill: "#5eb8ff" }));

  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export function DiceIcon({ className }: { className?: string }) {
  const pixels: { x: number; y: number; fill: string }[] = [];
  const add = (x: number, y: number, width: number, height: number, fill: string) => {
    for (let dy = 0; dy < height; dy += 1) {
      for (let dx = 0; dx < width; dx += 1) pixels.push({ x: x + dx, y: y + dy, fill });
    }
  };

  const teal = "#47f0c2";
  const white = "#f4f0e8";
  const dark = "#0b0e13";

  // Back die (showing 5), offset up-right.
  add(6, 1, 9, 9, teal);
  add(7, 2, 7, 7, white);
  add(8, 3, 1, 1, dark);
  add(11, 3, 1, 1, dark);
  add(8, 7, 1, 1, dark);
  add(11, 7, 1, 1, dark);
  add(9, 5, 1, 1, dark);

  // Front die (showing 3), offset down-left, drawn over the back die.
  add(1, 6, 9, 9, white);
  add(2, 7, 7, 7, dark);
  add(3, 8, 1, 1, teal);
  add(5, 10, 1, 1, teal);
  add(7, 12, 1, 1, teal);

  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export function BlackjackIcon({ className }: { className?: string }) {
  const pixels: { x: number; y: number; fill: string }[] = [];
  const add = (x: number, y: number, width: number, height: number, fill: string) => {
    for (let dy = 0; dy < height; dy += 1) {
      for (let dx = 0; dx < width; dx += 1) pixels.push({ x: x + dx, y: y + dy, fill });
    }
  };

  const gold = "#f4c542";
  const blue = "#5eb8ff";
  const red = "#e74c4c";
  const white = "#f4f0e8";
  const dark = "#0b0e13";

  add(2, 3, 7, 11, gold);
  add(3, 4, 5, 9, white);
  add(7, 1, 7, 11, blue);
  add(8, 2, 5, 9, white);
  add(4, 5, 2, 1, red);
  add(4, 6, 1, 2, red);
  add(9, 3, 2, 1, dark);
  add(9, 4, 1, 2, dark);
  add(11, 4, 1, 2, dark);
  add(10, 7, 2, 2, red);
  add(4, 10, 2, 1, dark);
  add(9, 10, 3, 1, dark);

  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export function ScratchIcon({ className }: { className?: string }) {
  return <PixelIcon grid={TICKET_GRID} colors={{ 1: accent, 2: "#0b0e13" }} className={className} />;
}

export function BallIcon({ className }: { className?: string }) {
  return <PixelIcon grid={BALL_GRID} colors={{ 1: accent2, 2: "#0b0e13" }} className={className} />;
}

export function ClockIcon({ className }: { className?: string }) {
  return <PixelIcon grid={CLOCK_GRID} colors={{ 1: gold, 2: "#0b0e13" }} className={className} />;
}

export function PencilIcon({ className }: { className?: string }) {
  return <PixelIcon grid={PENCIL_GRID} colors={{ 1: accent, 2: gold }} className={className} />;
}
