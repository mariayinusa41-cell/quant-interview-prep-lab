"use client";

// Renders one or more dice faces. Standard pip layouts for d6 (and a
// numeral-in-a-diamond fallback for anything with more than 6 faces, since
// a d20 doesn't have a conventional pip arrangement).

const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [28, 72], [72, 28], [72, 72]],
  5: [[28, 28], [28, 72], [50, 50], [72, 28], [72, 72]],
  6: [[28, 25], [28, 50], [28, 75], [72, 25], [72, 50], [72, 75]],
};

function DieFace({ value, sides, size }: { value: number; sides: number; size: number }) {
  const clamped = Math.min(Math.max(Math.round(value), 1), sides);
  const usesPips = sides <= 6;
  const dots = usesPips ? PIP_LAYOUT[clamped] ?? PIP_LAYOUT[1] : [];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="dice-lab-die">
      <rect x="5" y="5" width="90" height="90" rx="18" fill="#181c24" stroke="#47f0c2" strokeWidth="4" />
      <rect x="10" y="10" width="80" height="80" rx="14" fill="rgba(71, 240, 194, 0.06)" />
      {usesPips
        ? dots.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="7.5" fill="#47f0c2" className="dice-lab-pip" />
          ))
        : (
            <text x="50" y="62" textAnchor="middle" fontSize="34" fontFamily="var(--font-mono, monospace)" fontWeight="700" fill="#47f0c2">
              {clamped}
            </text>
          )}
    </svg>
  );
}

export function DiceVisualizer({ values, sides, size = 64 }: { values: number[]; sides: number; size?: number }) {
  return (
    <div className="dice-lab-visual">
      {values.map((v, i) => (
        <DieFace key={i} value={v} sides={sides} size={size} />
      ))}
    </div>
  );
}
