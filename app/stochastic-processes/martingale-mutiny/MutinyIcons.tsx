// Small pixel-art icons for the boat/ocean/island theme — same hand-drawn
// grid technique used elsewhere on the site (0 = empty, other codes map to
// colors).

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
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" aria-hidden="true">
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

const BOAT_GRID: PixelGrid = [
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
  [3, 3, 3, 3, 3, 3, 3, 3],
  [0, 2, 0, 2, 0, 2, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export function BoatIcon({ className }: { className?: string }) {
  return <PixelIcon grid={BOAT_GRID} colors={{ 1: "#f4f0e8", 2: "#5eb8ff", 3: "#8a5a2b" }} className={className} />;
}

const ISLAND_GRID: PixelGrid = [
  [0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 3, 3, 3, 0, 0, 0],
  [0, 0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 4, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 2, 2, 2, 2, 2, 2],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export function IslandIcon({ className }: { className?: string }) {
  return (
    <PixelIcon
      grid={ISLAND_GRID}
      colors={{ 1: "#e8d7a3", 2: "#5eb8ff", 3: "#59c98f", 4: "#8a5a2b" }}
      className={className}
    />
  );
}

const REEF_GRID: PixelGrid = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 2],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export function ReefIcon({ className }: { className?: string }) {
  return <PixelIcon grid={REEF_GRID} colors={{ 1: "#5a3d10", 2: "#e74c4c" }} className={className} />;
}
