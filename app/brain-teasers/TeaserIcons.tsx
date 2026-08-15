// Small pixel-art icons for the Brain Teasers index tiles — same grid style
// as the full-size sprites used inside each puzzle, just scaled down, so the
// index reads as part of the same graphic system instead of stock emoji.

const CHEST_GRID = [
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
  [3, 6, 6, 6, 6, 6, 6, 6, 6, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 6, 6, 6, 6, 5, 5, 3],
  [3, 5, 5, 6, 3, 3, 6, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
];

export function ChestTileIcon() {
  const outline = "#241407";
  const wood = "#8a5a2b";
  const gold = "#f4c542";
  const colorFor = (code: number) => (code === 3 ? outline : code === 5 ? wood : code === 6 ? gold : null);
  return (
    <svg viewBox="0 0 10 9" className="teaser-tile-svg" shapeRendering="crispEdges">
      {CHEST_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const TIGER_GRID = [
  [0, 3, 0, 0, 0, 0, 3, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 1, 4, 4, 1, 3, 1],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [3, 1, 1, 1, 1, 1, 1, 3],
  [0, 1, 3, 1, 1, 3, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 2, 1, 1, 1, 1, 2, 0],
  [0, 0, 2, 2, 2, 2, 0, 0],
];

export function TigerTileIcon() {
  const fur = "#e8862c";
  const cream = "#fbe4c4";
  const outline = "#231409";
  const eye = "#f4f0e8";
  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return fur;
      case 2:
        return cream;
      case 3:
        return outline;
      case 4:
        return eye;
      default:
        return null;
    }
  };
  return (
    <svg viewBox="0 0 8 10" className="teaser-tile-svg" shapeRendering="crispEdges">
      {TIGER_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}
