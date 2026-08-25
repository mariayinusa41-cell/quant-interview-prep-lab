// Questions answered — drawn as a quiz card with a question mark on it.
//
// The Questions tile used a bare "?" text character while every other stat
// tile used pixel art, so it read as a missing asset sitting in a row of
// real icons. Same 8x8 grid convention as TicketIcon and TokenIcon so all
// three line up.
export default function QuestionsIcon({ className }: { className?: string }) {
  const pixels = [
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 2, 3, 3, 2, 2, 1],
    [1, 2, 2, 2, 3, 2, 2, 1],
    [1, 2, 2, 2, 3, 2, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 2, 2, 3, 2, 2, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ];
  // Card in the same blue as the site's primary, mark punched out dark so it
  // reads at 18px rather than turning to mush.
  const colors: Record<number, string> = { 1: "#1a1410", 2: "#4fb3e0", 3: "#0f1a2b" };

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
