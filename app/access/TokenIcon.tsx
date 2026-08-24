export default function TokenIcon({ className }: { className?: string }) {
  const pixels = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 2, 2, 1, 1, 0],
    [1, 1, 2, 2, 2, 2, 1, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 1, 2, 2, 2, 2, 1, 1],
    [0, 1, 1, 2, 2, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ];
  const colors: Record<number, string> = { 1: "#1a1410", 2: "#f4c542", 3: "#ffe28a" };

  return (
    <svg viewBox="0 0 8 8" className={className ?? "access-token-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.flatMap((row, y) =>
        row.map((pixel, x) => (colors[pixel] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[pixel]} /> : null)),
      )}
    </svg>
  );
}
