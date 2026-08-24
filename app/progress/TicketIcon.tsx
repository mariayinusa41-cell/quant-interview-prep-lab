// Arcade prize ticket — the thing a skill game pays out, as opposed to the
// coin you put in. Same 8x8 pixel grid convention as TokenIcon so the two
// read as a matched pair in the HUD.
export default function TicketIcon({ className }: { className?: string }) {
  const pixels = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 2, 3, 2, 2, 3, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 1],
    [0, 1, 2, 2, 2, 2, 1, 0],
    [1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 3, 2, 2, 3, 2, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ];
  const colors: Record<number, string> = { 1: "#1a1410", 2: "#59c98f", 3: "#0f1a2b" };

  return (
    <svg
      viewBox="0 0 8 8"
      className={className ?? "access-token-icon"}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixels.flatMap((row, y) =>
        row.map((pixel, x) =>
          colors[pixel] ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[pixel]} />
          ) : null,
        ),
      )}
    </svg>
  );
}
