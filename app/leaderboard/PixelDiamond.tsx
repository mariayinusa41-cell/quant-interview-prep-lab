"use client";

// A spinning pixel-art diamond — the pass-holder badge next to a gold name.
// Straight edges rather than a curve (like an infinity loop) on purpose:
// hard angles stay crisp at small pixel sizes, a smooth curve just blurs.
// The "3D spin" is a CSS 3D rotation on a flat pixel sprite, not a modeled
// mesh — same trick as a paper cutout spinning on a string.
export default function PixelDiamond({ size = 16 }: { size?: number }) {
  const pixels = [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 2, 2, 1, 0],
    [1, 2, 3, 3, 2, 1],
    [1, 2, 2, 2, 2, 1],
    [0, 1, 2, 2, 1, 0],
    [0, 0, 1, 1, 0, 0],
  ];
  const colors: Record<number, string> = { 1: "#2a6bb0", 2: "#5eb8ff", 3: "#eaf6ff" };

  return (
    <span
      className="pixel-diamond-spin"
      style={{ width: size, height: size, display: "inline-block" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 6 6" width={size} height={size} shapeRendering="crispEdges">
        {pixels.flatMap((row, y) =>
          row.map((p, x) => (colors[p] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[p]} /> : null)),
        )}
      </svg>
    </span>
  );
}
