"use client";

// Shared pixel-art building blocks for the Pick 3/4/5 games — retro 8-bit/
// NES-era look, matching the technique already established by the Screwy
// Pirates sprites (PIRATE_GRID + shapeRendering="crispEdges"): every shape
// is an NxM grid of color-index rows mapped to <rect> elements, flat color
// fields only, no gradients or anti-aliasing. Fully original artwork — no
// characters, logos, or sprites from any existing game.
//
// Palette is a near-direct extension of PIRATE_LOOKS — the border, eye/
// white, gold, blue, green, and red hex values below are reused exactly
// from PirateStory.tsx, so this reads as one site palette, not a
// per-section one.

export const PIXEL_COLORS = {
  bg: "#0f1a2b",
  border: "#1a1410",
  primary: "#4fb3e0",
  accent: "#f4c542",
  accentLight: "#ffe28a",
  good: "#59c98f",
  bad: "#e74c4c",
  white: "#f4f0e8",
} as const;

// 1 = border color, 0 = fill color. The digit itself is rendered as text on
// top using the pixel font, not drawn pixel-by-pixel.
const TILE_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

// 1 = outline, 2 = gold fill, 3 = lighter gold "shine" pixel. A coin doesn't
// need to be a perfect circle in pixel art — a rough octagon reads fine at
// small sizes.
const COIN_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 1, 1, 0],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [1, 2, 2, 3, 2, 2, 2, 1],
  [1, 2, 2, 2, 3, 2, 2, 1],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [0, 1, 1, 2, 2, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

// Small 3x3 plus-shape burst used for the win-banner sparkles.
const SPARKLE_GRID = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
];

function PixelGrid({
  grid,
  colors,
  className,
}: {
  grid: number[][];
  colors: Record<number, string>;
  className?: string;
}) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
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

export type DigitTileState = "idle" | "selected" | "locked";

// One 0-9 picker slot. `revealed` triggers the stepped pixel-pop animation
// (scale 0.8 -> 1.15 -> 1 over 3 discrete frames) — used when a digit's
// result is revealed, not while the player is still choosing.
export function DigitTile({
  digit,
  state = "idle",
  revealed,
  disabled,
  onClick,
  ariaLabel,
}: {
  digit: number | string;
  state?: DigitTileState;
  revealed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const fill = state === "idle" ? PIXEL_COLORS.primary : PIXEL_COLORS.accent;
  return (
    <button
      type="button"
      className={revealed ? "pixel-digit-tile pixel-reveal" : "pixel-digit-tile"}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? `Digit ${digit}`}
    >
      <PixelGrid grid={TILE_GRID} colors={{ 1: PIXEL_COLORS.border, 0: fill }} className="pixel-digit-tile-grid" />
      <span className="pixel-digit-tile-value">{digit}</span>
    </button>
  );
}

export function CoinIcon({ className }: { className?: string }) {
  return (
    <PixelGrid
      grid={COIN_GRID}
      colors={{ 1: PIXEL_COLORS.border, 2: PIXEL_COLORS.accent, 3: PIXEL_COLORS.accentLight }}
      className={className ?? "pixel-coin"}
    />
  );
}

// Convenience wrapper: coin icon + dollar amount, in the pixel-heading font.
export function PixelPayout({ amount }: { amount: string }) {
  return (
    <span className="pixel-payout">
      <CoinIcon />
      {amount}
    </span>
  );
}

function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <span className="pixel-sparkle" style={style}>
      <PixelGrid grid={SPARKLE_GRID} colors={{ 1: PIXEL_COLORS.accent }} />
    </span>
  );
}

// Win/loss result banner. Wins get a few blinking sparkle bursts around the
// frame; losses render flat and unceremonious on purpose — no near-miss
// framing or "so close!" styling, same principle as the Scratch-Off reveal.
export function ResultBanner({
  outcome,
  title,
  sub,
}: {
  outcome: "win" | "loss";
  title: string;
  sub?: string;
}) {
  return (
    <div className={outcome === "win" ? "pixel-banner is-win" : "pixel-banner is-loss"}>
      {outcome === "win" && (
        <>
          <Sparkle style={{ top: -6, left: -6 }} />
          <Sparkle style={{ top: -8, right: 8 }} />
          <Sparkle style={{ bottom: -6, right: -6 }} />
        </>
      )}
      <p className="pixel-banner-title">{title}</p>
      {sub && <p className="pixel-banner-sub">{sub}</p>}
    </div>
  );
}
