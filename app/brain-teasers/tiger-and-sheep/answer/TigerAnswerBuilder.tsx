"use client";

import { useState } from "react";

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

function PixelTigerIcon() {
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
    <svg viewBox="0 0 8 10" className="pixel-tiger-svg answer-pirate-icon" shapeRendering="crispEdges">
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

const TIGER_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 100];

// The rule: a tiger only eats if doing so leaves it safe — which happens
// exactly when the resulting (n - 1)-tiger island is itself safe, i.e. even.
// That recursion bottoms out at n = 1 (always eaten). Net result: eaten iff
// the tiger count is odd.
const isEaten = (n: number) => n % 2 === 1;

const CONCEPT_CHECKS: { label: string; patterns: RegExp[] }[] = [
  { label: "Tigers are rational", patterns: [/rational/i] },
  { label: "Above all, they want to survive", patterns: [/surviv|alive|safe|risk/i] },
  { label: "Eating turns the tiger into a sheep", patterns: [/becomes?\s+a\s+sheep|turns?\s+into|itself\s+a\s+sheep/i] },
  {
    label: "Reasons about the smaller (n - 1) case",
    patterns: [/\bn\s*-\s*1|\bprevious|\bsmaller|\binduction|\bone\s+fewer|\bone\s+less/i],
  },
  { label: "Notices the odd/even pattern", patterns: [/\bodd\b|\beven\b|\bparity\b/i] },
];

export default function TigerAnswerBuilder() {
  const [count, setCount] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<"eaten" | "safe" | null>(null);
  const [explanation, setExplanation] = useState("");
  const [showResults, setShowResults] = useState(false);

  const selectCount = (n: number) => {
    setCount(n);
    setPrediction(null);
    setShowResults(false);
  };

  const correct = count !== null ? (isEaten(count) ? "eaten" : "safe") : null;
  const isCorrect = showResults && prediction === correct;
  const conceptsFound = CONCEPT_CHECKS.filter((c) => c.patterns.some((p) => p.test(explanation)));

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Tiger and Sheep</p>
      <h1 className="pirate-story-line answer-title">Work out the rule</h1>
      <p className="pirate-story-line answer-subtitle">
        Pick a tiger count, predict whether the sheep gets eaten, then check your answer.
      </p>

      <div className="answer-crew-picker">
        {TIGER_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            className={count === n ? "chip-btn active" : "chip-btn"}
            onClick={() => selectCount(n)}
          >
            {n} tiger{n > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      {count !== null && (
        <>
          <div className="tiger-answer-preview">
            <PixelTigerIcon />
            <span className="tiger-answer-count">
              {count} tiger{count > 1 ? "s" : ""}, 1 sheep
            </span>
          </div>

          <div className="answer-crew-picker tiger-prediction-picker">
            <button
              type="button"
              className={prediction === "eaten" ? "chip-btn active" : "chip-btn"}
              onClick={() => setPrediction("eaten")}
            >
              Sheep gets eaten
            </button>
            <button
              type="button"
              className={prediction === "safe" ? "chip-btn active" : "chip-btn"}
              onClick={() => setPrediction("safe")}
            >
              Sheep is safe
            </button>
          </div>

          {showResults && (
            <p className={isCorrect ? "answer-total is-complete" : "answer-total"} style={{ textAlign: "left" }}>
              {isCorrect ? "✓ Correct." : `✗ Not quite — with ${count} tigers, the sheep is ${correct}.`}
            </p>
          )}

          <div className="answer-field">
            <label htmlFor="tiger-explanation">Explain how you got your answer, and why.</label>
            <textarea
              id="tiger-explanation"
              className="answer-textarea"
              rows={5}
              placeholder="Walk through your reasoning here..."
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="continue-btn answer-check-btn"
            disabled={prediction === null}
            onClick={() => setShowResults(true)}
          >
            Check my answer
          </button>

          {showResults && (
            <div className="answer-results">
              <div className="answer-checklist">
                <p className="answer-checklist-title">
                  Explanation — {conceptsFound.length} / {CONCEPT_CHECKS.length} key ideas found
                </p>
                <ul>
                  {CONCEPT_CHECKS.map((c) => (
                    <li key={c.label} className={conceptsFound.includes(c) ? "is-found" : "is-missing"}>
                      {conceptsFound.includes(c) ? "✓" : "○"} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showResults && (
            <a href="/brain-teasers/tiger-and-sheep/breakdown" className="continue-btn answer-next-btn">
              Full breakdown &amp; explanation →
            </a>
          )}
        </>
      )}
    </div>
  );
}
