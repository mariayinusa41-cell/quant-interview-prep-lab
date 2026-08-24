"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardinalDirection, DuckGameResult, DuckTrial, DuckTrialResult } from "./duckIntersectionTypes";
import { computeDuckGameResult, generateDuckTrial } from "./duckIntersectionEngine";
import { DuckHeadIcon, FlagIcon, QuadrantIcon } from "./DuckIcons";
import { AccessStartButton } from "../../access/TokenPlayButton";
import "../../drills/fermi/fermi.css";
import "./duckIntersection.css";

const TOTAL_TRIALS = 35;

const ARROW_GLYPHS: Record<CardinalDirection, string> = {
  NORTH: "▲",
  SOUTH: "▼",
  EAST: "►",
  WEST: "◄",
};

const DUCK_ROTATIONS: Record<CardinalDirection, string> = {
  NORTH: "rotate(0deg)",
  SOUTH: "rotate(180deg)",
  EAST: "rotate(90deg)",
  WEST: "rotate(270deg)",
};

// Bird's-eye duck — the view is straight down from above, bill pointing
// "up" (toward y=0) in local space, which is what reads as "forward" once
// the parent rotates the whole sprite to match the current facing. Both
// eyes show (a top-down bird shows both, one on each side of the head),
// wings sit symmetrically left/right of the body, and the two webbed feet
// swap which one is "kicked out" between frames for the waddle.
function PixelDuck({ legFrame }: { legFrame: 0 | 1 }) {
  const bill = "#ff9d2e";
  const billTip = "#c97418";
  const body = "#f4c542";
  const wingShade = "#d2a122";
  const eye = "#161311";
  const foot = "#ff9d2e";

  return (
    <svg width="52" height="58" viewBox="0 0 16 18" className="pixel-duck-svg">
      {/* bill, tapering toward the tip */}
      <rect x="6" y="0" width="4" height="1" fill={billTip} />
      <rect x="5" y="1" width="6" height="2" fill={bill} />
      {/* head */}
      <rect x="5" y="3" width="6" height="3" fill={body} />
      {/* eyes, one each side — visible from directly above */}
      <rect x="5" y="3" width="1" height="1" fill={eye} />
      <rect x="10" y="3" width="1" height="1" fill={eye} />
      {/* neck taper into body */}
      <rect x="4" y="6" width="8" height="1" fill={body} />
      {/* body */}
      <rect x="3" y="7" width="10" height="7" fill={body} />
      {/* wings, symmetric */}
      <rect x="2" y="8" width="2" height="5" fill={wingShade} />
      <rect x="12" y="8" width="2" height="5" fill={wingShade} />
      {/* tail */}
      <rect x="6" y="14" width="4" height="2" fill={wingShade} />
      {/* feet — swap which one is kicked outward between frames */}
      {legFrame === 0 ? (
        <>
          <rect x="3" y="15" width="2" height="2" fill={foot} />
          <rect x="10" y="14" width="2" height="2" fill={foot} />
        </>
      ) : (
        <>
          <rect x="4" y="14" width="2" height="2" fill={foot} />
          <rect x="11" y="15" width="2" height="2" fill={foot} />
        </>
      )}
    </svg>
  );
}

type GameState = "lobby" | "playing" | "game-over";

export default function DuckIntersectionGame() {
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [currentTrial, setCurrentTrial] = useState<DuckTrial | null>(null);
  const [trialCount, setTrialCount] = useState(0);
  const [runLength, setRunLength] = useState(0);
  const [results, setResults] = useState<DuckTrialResult[]>([]);
  const [flashVerdict, setFlashVerdict] = useState<"correct" | "wrong" | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  // Toggled on an interval, not a full rAF loop — a waddle only needs to
  // change a few times a second, same idea as the dino's alternating-leg
  // frames but far cheaper since it's just a class swap, not a canvas redraw.
  const [legFrame, setLegFrame] = useState<0 | 1>(0);

  const startTimeRef = useRef<number>(Date.now());

  // Keeps the duck "running in place" the whole time a trial is on screen —
  // this is the piece that was missing before: nothing on the board moved
  // continuously, it only reacted to answers.
  useEffect(() => {
    if (gameState !== "playing") return;
    const id = setInterval(() => setLegFrame((f) => (f === 0 ? 1 : 0)), 220);
    return () => clearInterval(id);
  }, [gameState]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("duck-intersection-best");
      if (stored) setBestScore(Number(stored));
    } catch { /* noop */ }
  }, []);

  const startNewGame = () => {
    setTrialCount(1);
    setRunLength(0);
    setResults([]);
    setFlashVerdict(null);
    setCurrentTrial(generateDuckTrial(1));
    setGameState("playing");
    startTimeRef.current = Date.now();
  };

  const handleResponse = useCallback(
    (answer: "YES" | "NO") => {
      if (gameState !== "playing" || !currentTrial) return;

      const rt = Date.now() - startTimeRef.current;
      const isCorrect = answer === currentTrial.correctAnswer;

      setFlashVerdict(isCorrect ? "correct" : "wrong");
      setTimeout(() => setFlashVerdict(null), 160);

      const result: DuckTrialResult = {
        trialId: currentTrial.id,
        type: currentTrial.type,
        isSwitchTrial: currentTrial.isSwitchTrial,
        userAnswer: answer,
        isCorrect,
        reactionTimeMs: rt,
      };
      const nextResults = [...results, result];
      setResults(nextResults);

      const nextRunLength = currentTrial.isSwitchTrial ? 1 : runLength + 1;
      setRunLength(nextRunLength);

      if (trialCount < TOTAL_TRIALS) {
        setTrialCount((t) => t + 1);
        setCurrentTrial(generateDuckTrial(trialCount + 1, currentTrial.type, nextRunLength));
        startTimeRef.current = Date.now();
      } else {
        const final = computeDuckGameResult(nextResults);
        if (bestScore === null || final.score > bestScore) {
          setBestScore(final.score);
          try { localStorage.setItem("duck-intersection-best", String(final.score)); } catch { /* noop */ }
        }
        setGameState("game-over");
      }
    },
    [gameState, currentTrial, trialCount, runLength, results, bestScore]
  );

  // Z / ArrowLeft -> YES, M / ArrowRight -> NO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "z" || e.key === "Z" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleResponse("YES");
      } else if (e.key === "m" || e.key === "M" || e.key === "ArrowRight") {
        e.preventDefault();
        handleResponse("NO");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, handleResponse]);

  const finalResult = gameState === "game-over" ? computeDuckGameResult(results) : null;

  // Response labels depend on which stream this trial is asking about —
  // the original draft always showed "EVEN / ODD" even during a
  // motion-congruence trial, which had nothing to do with parity.
  const leftLabel = currentTrial?.type === "motion-congruence" ? "YES (MATCH)" : "YES (EVEN)";
  const rightLabel = currentTrial?.type === "motion-congruence" ? "NO (DIFFERENT)" : "NO (ODD)";

  // Each channel scrolls along its own axis. A direction with no component
  // on that axis (e.g. EAST on the vertical road) idles instead of picking
  // an arbitrary way to slide.
  const dir = currentTrial?.duckState.roadArrowDirection;
  const vFlowClass = dir === "NORTH" ? "flow-up" : dir === "SOUTH" ? "flow-down" : "flow-idle";
  const hFlowClass = dir === "EAST" ? "flow-right" : dir === "WEST" ? "flow-left" : "flow-idle";
  const vStripArrows = Array.from({ length: 10 }, () => (dir ? ARROW_GLYPHS[dir] : ""));
  const hStripArrows = Array.from({ length: 10 }, () => (dir ? ARROW_GLYPHS[dir] : ""));

  return (
    <div className="duck-container">
      {gameState === "lobby" && (
        <div className="pixel-stage" style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
          <h2 className="intro-title" style={{ fontSize: "1.2rem" }}>
            Crossroad Multitasker
          </h2>
          <p className="hero-tagline" style={{ margin: "14px auto" }}>
            Dual-stream peripheral tracking and motion congruence under rapid set-shifting.
          </p>

          <div className="duck-rules-box">
            <div className="duck-rule-item">
              <div className="duck-rule-heading">
                <DuckHeadIcon className="duck-rule-icon" />
                <strong style={{ color: "var(--pixel-accent)" }}>STREAM 1: ROAD ARROWS</strong>
              </div>
              <p>
                Is the duck running in the <strong>SAME</strong> direction as the road flow?
              </p>
            </div>
            <div className="duck-rule-item">
              <div className="duck-rule-heading">
                <QuadrantIcon className="duck-rule-icon" />
                <strong style={{ color: "var(--pixel-primary)" }}>STREAM 2: CORNER MATH</strong>
              </div>
              <p>
                Is the highlighted quadrant's (NW, NE, SW, SE) result <strong>EVEN</strong>?
              </p>
            </div>
          </div>

          {bestScore !== null && <p className="fermi-best">Personal best: {bestScore} pts</p>}

          <AccessStartButton
            gameId="drills-duck-intersection"
            title="Crossroad Multitasker"
            defaultLabel={`Start Run (${TOTAL_TRIALS} Trials)`}
            className="hs-chunky-btn"
            onStart={startNewGame}
          >
            Start Run ({TOTAL_TRIALS} Trials)
          </AccessStartButton>
        </div>
      )}

      {gameState === "playing" && currentTrial && (
        <div className="duck-arena">
          <div className="fermi-hud">
            <span className="fermi-hud-q">Trial #{trialCount} / {TOTAL_TRIALS}</span>
            <span
              className="fermi-hud-cat"
              style={{ color: currentTrial.type === "motion-congruence" ? "var(--pixel-accent)" : "var(--pixel-primary)" }}
            >
              {currentTrial.type === "motion-congruence" ? (
                <DuckHeadIcon className="duck-hud-icon" />
              ) : (
                <QuadrantIcon className="duck-hud-icon" />
              )}
              {currentTrial.type === "motion-congruence" ? "MOTION STREAM" : "CORNER MATH"}
            </span>
            <span className="fermi-hud-score">
              Acc: {results.length > 0 ? `${Math.round((results.filter((r) => r.isCorrect).length / results.length) * 100)}%` : "—"}
            </span>
          </div>

          <div className={`duck-prompt-banner ${currentTrial.type}`}>
            {currentTrial.type === "motion-congruence" ? (
              <span>Does duck direction MATCH road arrows?</span>
            ) : (
              <span>Is the result in [{currentTrial.activeQuadrant}] EVEN?</span>
            )}
          </div>

          <div className={`duck-stage-viewport ${flashVerdict === "correct" ? "flash-good" : flashVerdict === "wrong" ? "flash-bad" : ""}`}>
            <div className={`duck-corner nw ${currentTrial.activeQuadrant === "NW" && currentTrial.type === "quadrant-math" ? "active-corner" : ""}`}>
              <span className="corner-tag">NW</span>
              <strong className="corner-math">{currentTrial.corners.NW.expression}</strong>
            </div>
            <div className={`duck-corner ne ${currentTrial.activeQuadrant === "NE" && currentTrial.type === "quadrant-math" ? "active-corner" : ""}`}>
              <span className="corner-tag">NE</span>
              <strong className="corner-math">{currentTrial.corners.NE.expression}</strong>
            </div>
            <div className={`duck-corner sw ${currentTrial.activeQuadrant === "SW" && currentTrial.type === "quadrant-math" ? "active-corner" : ""}`}>
              <span className="corner-tag">SW</span>
              <strong className="corner-math">{currentTrial.corners.SW.expression}</strong>
            </div>
            <div className={`duck-corner se ${currentTrial.activeQuadrant === "SE" && currentTrial.type === "quadrant-math" ? "active-corner" : ""}`}>
              <span className="corner-tag">SE</span>
              <strong className="corner-math">{currentTrial.corners.SE.expression}</strong>
            </div>

            {/* Continuously-scrolling arrow strips, not static glyphs — each
                road channel flows along its own axis. A direction with no
                meaning on that axis (e.g. EAST/WEST on the vertical road)
                just idles, rather than sliding a certain way for no reason. */}
            <div className="duck-road vertical">
              <div className={`duck-arrow-strip vertical ${vFlowClass}`}>
                {vStripArrows.map((g, i) => (
                  <span key={i} className="duck-road-arrow">{g}</span>
                ))}
              </div>
            </div>
            <div className="duck-road horizontal">
              <div className={`duck-arrow-strip horizontal ${hFlowClass}`}>
                {hStripArrows.map((g, i) => (
                  <span key={i} className="duck-road-arrow">{g}</span>
                ))}
              </div>
            </div>

            {/* Actually walks across the intersection and wraps around —
                not a static badge that just sits in the middle. Key is on
                the direction: React needs to treat a facing change as a
                brand-new element so the walk animation restarts from the
                correct edge instead of jumping mid-stride. */}
            <div
              key={currentTrial.duckState.facing}
              className={`duck-center-hub walk-${currentTrial.duckState.facing.toLowerCase()}`}
            >
              <div className="duck-sprite-wrap" style={{ transform: DUCK_ROTATIONS[currentTrial.duckState.facing] }}>
                <PixelDuck legFrame={legFrame} />
              </div>
            </div>
          </div>

          <div className="ts-action-dock">
            <button type="button" className="ts-btn-response left" onClick={() => handleResponse("YES")}>
              <span className="ts-btn-key">[Z / ←]</span>
              <strong className="ts-btn-label">{leftLabel}</strong>
            </button>
            <button type="button" className="ts-btn-response right" onClick={() => handleResponse("NO")}>
              <span className="ts-btn-key">[M / →]</span>
              <strong className="ts-btn-label">{rightLabel}</strong>
            </button>
          </div>
        </div>
      )}

      {gameState === "game-over" && finalResult && (
        <div className="pixel-stage" style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
          <div className="pixel-banner is-win" style={{ marginBottom: "1.5rem" }}>
            <span className="pixel-banner-title">
              <FlagIcon className="duck-banner-icon" />
              Test Complete
            </span>
            <span className="pixel-banner-sub">Multitasking & Spatial Attention Report</span>
          </div>

          <div className="ts-summary-grid">
            <div className="ts-stat-card">
              <span>Final Score</span>
              <strong style={{ color: "var(--pixel-accent)" }}>{finalResult.score}</strong>
            </div>
            <div className="ts-stat-card">
              <span>Accuracy</span>
              <strong style={{ color: "var(--pixel-good)" }}>{finalResult.accuracyPct}%</strong>
            </div>
            <div className="ts-stat-card">
              <span>Average RT</span>
              <strong>{finalResult.avgReactionTimeMs} ms</strong>
            </div>
            <div className="ts-stat-card">
              <span>Switch Cost</span>
              <strong style={{ color: finalResult.switchCostMs <= 150 ? "var(--pixel-good)" : "var(--pixel-bad)" }}>
                {finalResult.switchCostMs >= 0 ? "+" : ""}
                {finalResult.switchCostMs} ms
              </strong>
            </div>
          </div>

          <AccessStartButton
            gameId="drills-duck-intersection"
            title="Crossroad Multitasker"
            defaultLabel="Play again"
            className="hs-chunky-btn"
            onStart={startNewGame}
          >
            Play again →
          </AccessStartButton>
        </div>
      )}
    </div>
  );
}
