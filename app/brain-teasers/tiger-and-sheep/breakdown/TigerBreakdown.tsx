"use client";

import { useEffect, useMemo, useState } from "react";

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

function PixelTiger({ dimmed, className }: { dimmed?: boolean; className?: string }) {
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

  const classes = ["pixel-tiger-svg", dimmed && "is-dimmed", className].filter(Boolean).join(" ");

  return (
    <svg viewBox="0 0 8 10" className={classes} shapeRendering="crispEdges">
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

function PixelSheep({ className }: { className?: string }) {
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
    <svg viewBox="0 0 8 10" className={`pixel-sheep-svg ${className ?? ""}`} shapeRendering="crispEdges">
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

const MAX_TIGERS = 4;

type Step = { n: number; eaten: boolean };

// The actual rule, computed rather than hardcoded: a tiger only risks eating
// the sheep if doing so leaves it safe as the new sheep — which is exactly
// the case when the *next* smaller count (n - 1) is itself a "safe" (even)
// count. This recursion bottoms out at n = 1 (always eaten, nothing to fear).
function buildSteps(maxN: number): Step[] {
  const steps: Step[] = [];
  for (let n = 1; n <= maxN; n++) {
    steps.push({ n, eaten: n % 2 === 1 });
  }
  return steps;
}

function captionFor(step: Step): string {
  const { n, eaten } = step;
  if (n === 1) {
    return "With just 1 tiger, there's no one left to eat it once it becomes a sheep. It eats.";
  }
  const remaining = n - 1;
  const remainingNoun = remaining === 1 ? "tiger" : "tigers";
  if (!eaten) {
    return `With ${n} tigers, eating turns you into a sheep among ${remaining} ${remainingNoun} - an odd-numbered island, which every tiger here already knows gets eaten. Too risky. No one eats.`;
  }
  return `With ${n} tigers, eating turns you into a sheep among ${remaining} ${remainingNoun} - an even-numbered island, which every tiger here already knows is safe. So one tiger eats.`;
}

const STEP_HOLD_MS = 5200;

// The eat sequence, when it happens, plays through these stages before the
// step is considered "settled": the eater lunges and the sheep dissolves,
// then the eater itself dissolves and reforms as the new sheep.
type AnimStage = "idle" | "eating" | "transforming" | "done";
const EATING_MS = 550;
const TRANSFORM_MS = 650;

export default function TigerBreakdown() {
  const steps = useMemo(() => buildSteps(MAX_TIGERS), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [animStage, setAnimStage] = useState<AnimStage>("idle");
  const [isLastStepDone, setIsLastStepDone] = useState(false);

  useEffect(() => {
    setAnimStage("idle");
    const step = steps[stepIndex];
    const revealTimer = window.setTimeout(() => {
      setAnimStage(step.eaten ? "eating" : "done");
    }, 700);

    const timers: number[] = [revealTimer];
    if (step.eaten) {
      timers.push(window.setTimeout(() => setAnimStage("transforming"), 700 + EATING_MS));
      timers.push(window.setTimeout(() => setAnimStage("done"), 700 + EATING_MS + TRANSFORM_MS));
    }

    const isLastStep = stepIndex === steps.length - 1;
    if (!isLastStep) {
      timers.push(
        window.setTimeout(() => {
          setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        }, STEP_HOLD_MS)
      );
    } else {
      timers.push(window.setTimeout(() => setIsLastStepDone(true), STEP_HOLD_MS));
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stepIndex, steps]);

  const step = steps[stepIndex];
  const tigerCount = step.n;
  const outcomeShown = animStage !== "idle";
  const isLastStep = stepIndex === steps.length - 1;

  const canSkip = !isLastStepDone;
  const handleSkip = () => {
    if (animStage !== "done") {
      setAnimStage("done");
      return;
    }
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
    } else {
      setIsLastStepDone(true);
    }
  };

  const restart = () => {
    setIsLastStepDone(false);
    setStepIndex(0);
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

      <div className="breakdown-progress">
        {steps.map((s, i) => (
          <button
            key={s.n}
            type="button"
            className={i === stepIndex ? "breakdown-dot is-active" : "breakdown-dot"}
            aria-label={`Jump to ${s.n} tiger${s.n > 1 ? "s" : ""}`}
            onClick={() => {
              setIsLastStepDone(false);
              setStepIndex(i);
            }}
          />
        ))}
      </div>

      <p key={stepIndex} className="pirate-story-line pirate-enter breakdown-caption" style={{ animationDelay: "0s" }}>
        {captionFor(step)}
      </p>

      <div className="tiger-scene">
        <div className="tiger-row">
          {Array.from({ length: tigerCount }, (_, i) => {
            const isEater = step.eaten && i === 0;

            if (isEater) {
              return (
                <div className="tiger-slot pirate-enter" style={{ animationDelay: `${i * 0.1}s` }} key={i}>
                  <div className="tiger-eater-figure">
                    <PixelTiger
                      className={
                        animStage === "eating"
                          ? "is-lunging"
                          : animStage === "transforming" || animStage === "done"
                            ? "is-becoming-sheep"
                            : undefined
                      }
                    />
                    {(animStage === "transforming" || animStage === "done") && (
                      <PixelSheep className="eater-sheep-reveal" />
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div className="tiger-slot pirate-enter" style={{ animationDelay: `${i * 0.1}s` }} key={i}>
                <PixelTiger dimmed={outcomeShown && step.eaten} />
              </div>
            );
          })}
        </div>
        <div className="sheep-slot">
          {!(step.eaten && (animStage === "eating" || animStage === "transforming" || animStage === "done")) && (
            <PixelSheep className={animStage === "done" && !step.eaten ? "is-scared" : undefined} />
          )}
          {step.eaten && animStage === "eating" && <PixelSheep className="is-dissolving" />}
          {outcomeShown && (
            <span className={step.eaten ? "sheep-outcome-label is-eaten" : "sheep-outcome-label is-safe"}>
              {step.eaten ? "The sheep is eaten." : "The sheep is safe."}
            </span>
          )}
        </div>
      </div>

      {isLastStepDone && (
        <div className="breakdown-formula">
          <p className="pirate-story-line">The pattern holds for any tiger count n:</p>
          <code className="breakdown-code">eaten(n) = (n is odd)</code>
          <p className="pirate-story-line breakdown-caption" style={{ fontSize: "0.95rem" }}>
            100 is even - so on the real island, the sheep is safe.
          </p>
          <button type="button" className="chip-btn" onClick={restart}>
            Watch it again from n = 1
          </button>
        </div>
      )}
    </div>
  );
}
