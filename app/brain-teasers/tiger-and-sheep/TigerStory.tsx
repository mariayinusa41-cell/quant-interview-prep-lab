"use client";

import { useEffect, useState } from "react";

// 8-wide x 10-tall pixel-art tiger bust.
// 0 empty, 1 orange fur, 2 cream muzzle/chest, 3 black stripe/outline, 4 eye
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

// 8-wide x 10-tall pixel-art sheep bust.
// 0 empty, 1 wool, 2 face, 3 outline, 4 eye
const SHEEP_GRID = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 4, 2, 2, 4, 2, 0],
  [0, 3, 2, 2, 2, 2, 3, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 3, 1, 1, 1, 1, 3, 0],
  [0, 3, 0, 0, 0, 0, 3, 0],
];

function PixelTiger() {
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
    <svg viewBox="0 0 8 10" className="pixel-tiger-svg" shapeRendering="crispEdges">
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

function PixelSheep() {
  const wool = "#f4f1ea";
  const face = "#2a2420";
  const outline = "#171310";
  const eye = "#f4f0e8";

  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return wool;
      case 2:
        return face;
      case 3:
        return outline;
      case 4:
        return eye;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 8 10" className="pixel-sheep-svg" shapeRendering="crispEdges">
      {SHEEP_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

// Deterministic pseudo-random in [0, 1) — avoids a client/server hydration
// mismatch that plain Math.random() would cause.
function hash(seed: number) {
  const s = Math.sin(seed * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const GRASS_BLADES = Array.from({ length: 26 }, (_, i) => {
  const h1 = hash(i + 1);
  const h2 = hash(i + 30);
  return {
    left: (i / 26) * 100 + (h1 - 0.5) * 3,
    height: 14 + h2 * 16,
    delay: h1 * 2,
    duration: 2.2 + h2 * 1.4,
  };
});

function GrassField() {
  return (
    <div className="grass-field" aria-hidden="true">
      {GRASS_BLADES.map((blade, i) => (
        <span
          key={i}
          className="grass-blade"
          style={{
            left: `${blade.left}%`,
            height: `${blade.height}px`,
            animationDelay: `${blade.delay}s`,
            animationDuration: `${blade.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

const INTRO_LINES = [
  "A hundred tigers and one sheep share a magic island with nothing but grass.",
  "Tigers would rather eat the sheep — but any tiger that does instantly becomes a sheep itself.",
  "Every tiger is perfectly rational, and above all, wants to survive.",
];

const LINE_HOLD_MS = 3000;

export default function TigerStory() {
  const [lineIndex, setLineIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // Intro lines, one at a time.
  useEffect(() => {
    if (lineIndex >= INTRO_LINES.length) {
      const t = window.setTimeout(() => setStoryDone(true), 700);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setLineIndex((i) => i + 1), LINE_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [lineIndex]);

  useEffect(() => {
    if (storyDone) {
      const t = window.setTimeout(() => setShowContinue(true), 900);
      return () => window.clearTimeout(t);
    }
  }, [storyDone]);

  const canSkip = !storyDone;
  const handleSkip = () => {
    setLineIndex(INTRO_LINES.length);
    setStoryDone(true);
  };

  return (
    <div className="pirate-stage-content tiger-stage-content">
      <GrassField />

      {canSkip && (
        <button type="button" className="skip-btn" onClick={handleSkip}>
          Skip &raquo;
        </button>
      )}

      <p className="pirate-kicker">Tiger and Sheep</p>

      {!storyDone ? (
        <div className="tiger-intro-lines">
          {INTRO_LINES.slice(0, lineIndex + 1).map((line, i) => (
            <p
              key={i}
              className={i === lineIndex ? "pirate-story-line pirate-enter" : "pirate-story-line"}
              style={{ animationDelay: "0s", opacity: i === lineIndex ? undefined : 0.35 }}
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <>
          <div className="tiger-static-pair pirate-enter">
            <PixelTiger />
            <PixelSheep />
          </div>

          <p className="pirate-story-line pirate-enter final-question" style={{ animationDelay: "0s" }}>
            So with 100 tigers on the island — will the sheep be eaten?
          </p>
          {showContinue && (
            <a href="/brain-teasers/tiger-and-sheep/answer" className="continue-btn pirate-enter">
              Click to continue
            </a>
          )}
        </>
      )}
    </div>
  );
}
