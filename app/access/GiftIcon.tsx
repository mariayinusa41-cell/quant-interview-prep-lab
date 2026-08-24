export default function GiftIcon({ className }: { className?: string }) {
  const pixels = [
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 3, 3, 1, 1, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const colors: Record<number, string> = { 1: "#7a3b12", 2: "#f4c542", 3: "#ffe28a" };

  return (
    <svg viewBox="0 0 8 8" className={className ?? "access-gift-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.flatMap((row, y) =>
        row.map((pixel, x) => (colors[pixel] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[pixel]} /> : null)),
      )}
    </svg>
  );
}
