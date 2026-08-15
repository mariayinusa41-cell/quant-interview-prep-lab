"use client";

import { useMemo, useState } from "react";

// 8-wide x 10-tall pixel-art pirate bust — same grid as the main puzzle page.
// 0 empty, 1 hat/bandana, 2 skin, 3 outline/eyepatch, 4 eye, 5 body, 6 gold trim
const PIRATE_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [3, 2, 3, 2, 2, 4, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [0, 3, 2, 2, 2, 2, 3, 0],
  [0, 0, 5, 5, 5, 5, 0, 0],
  [0, 5, 5, 6, 6, 5, 5, 0],
  [0, 5, 5, 5, 5, 5, 5, 0],
];

// One look per pirate number, 1 through 6 — reused from the main puzzle page,
// plus a sixth crew member for the largest crew size here.
const PIRATE_LOOKS: Record<number, { hat: string; body: string; skin: string }> = {
  1: { hat: "#b98bff", body: "#5a3b8f", skin: "#f0c8a0" },
  2: { hat: "#59c98f", body: "#1f6b48", skin: "#8d5524" },
  3: { hat: "#4fb3e0", body: "#1c5a78", skin: "#e3b287" },
  4: { hat: "#f0a53b", body: "#7a4a12", skin: "#3d2317" },
  5: { hat: "#e74c4c", body: "#7a2323", skin: "#6b4226" },
  6: { hat: "#2fd4c4", body: "#12615a", skin: "#c98f5e" },
};

function PixelPirateIcon({ pirateNumber, senior }: { pirateNumber: number; senior: boolean }) {
  const look = PIRATE_LOOKS[pirateNumber] ?? PIRATE_LOOKS[1];
  const outline = "#1a1410";
  const eye = "#f4f0e8";
  const gold = "#f4c542";

  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return look.hat;
      case 2:
        return look.skin;
      case 3:
        return outline;
      case 4:
        return eye;
      case 5:
        return look.body;
      case 6:
        return senior ? gold : look.body;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 8 10" className="pixel-pirate-svg answer-pirate-icon" shapeRendering="crispEdges">
      {PIRATE_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const CREW_SIZES = [1, 2, 3, 4, 5, 6];

// The actual recursive game-theory solution, computed exactly (not guessed) —
// this is what the coin inputs get graded against. Each proposer needs
// ceil(k/2) votes total (including their own), so they bribe the cheapest
// (ceil(k/2) - 1) pirates: whoever got 0 coins in the (k-1)-pirate outcome.
function correctSplit(crewSize: number): Record<number, number> {
  let prev: Record<number, number> = { 1: 100 };
  for (let k = 2; k <= crewSize; k++) {
    const votesNeeded = Math.ceil(k / 2) - 1;
    const zeroGetters = Object.keys(prev)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((p) => prev[p] === 0);
    const bribed = new Set(zeroGetters.slice(0, votesNeeded));
    const current: Record<number, number> = { [k]: 100 - bribed.size };
    for (let p = 1; p < k; p++) current[p] = bribed.has(p) ? 1 : 0;
    prev = current;
  }
  return prev;
}

// Key ideas an explanation should touch on. Matching is a simple, transparent
// keyword search rather than an AI call — no API keys, no network round trip,
// no risk of the grader inventing feedback, and the checklist is legible.
const CONCEPT_CHECKS: { label: string; patterns: RegExp[] }[] = [
  { label: "Pirates are rational", patterns: [/rational/i] },
  { label: "Needs 50% of the vote to survive", patterns: [/50\s*%|\bhalf\b|\bmajorit|\bvote|\bsurviv|\balive\b/i] },
  {
    label: "Buys just enough votes as cheaply as possible",
    patterns: [/\bbribe|\boffer|\bbuy|\bincentiv|\b1\s*coin|\bone\s*coin/i],
  },
  {
    label: "Reasons about what happens if rejected (the next round)",
    patterns: [/\brepeat|\bnext\b|\brecursi|\botherwise|\bif\s+reject|\bprevious|\bwould\s+get/i],
  },
];

// Loose pattern check on the equation field — same idea as above: transparent
// and deterministic rather than an AI judgment call.
const EQUATION_CHECKS: { label: string; test: (eq: string) => boolean }[] = [
  { label: "Starts from the full 100 coins", test: (eq) => /100/.test(eq) },
  { label: "Rounds down (floor)", test: (eq) => /floor|round\s*down|⌊/i.test(eq) },
  { label: "Uses (n - 1)", test: (eq) => /\(?\s*n\s*-\s*1\s*\)?/i.test(eq) },
  { label: "Divides by 2", test: (eq) => /\/\s*2|÷\s*2|\*\s*0\.5|×\s*0\.5/.test(eq) },
];

export default function AnswerBuilder() {
  const [crewSize, setCrewSize] = useState<number | null>(null);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [explanation, setExplanation] = useState("");
  const [equation, setEquation] = useState("");
  const [showResults, setShowResults] = useState(false);

  const pirateOrder = useMemo(() => {
    if (!crewSize) return [];
    // Senior (highest number) proposes first, so list from senior down to junior.
    return Array.from({ length: crewSize }, (_, i) => crewSize - i);
  }, [crewSize]);

  const answerKey = useMemo(() => (crewSize ? correctSplit(crewSize) : {}), [crewSize]);

  const selectCrewSize = (size: number) => {
    setCrewSize(size);
    setAmounts({});
    setShowResults(false);
  };

  const setAmount = (pirateNumber: number, value: string) => {
    setAmounts((prev) => ({ ...prev, [pirateNumber]: value }));
  };

  const total = pirateOrder.reduce((sum, p) => sum + (Number(amounts[p]) || 0), 0);

  const coinsCorrectCount = pirateOrder.filter((p) => Number(amounts[p]) === answerKey[p]).length;
  const conceptsFound = CONCEPT_CHECKS.filter((c) => c.patterns.some((p) => p.test(explanation)));
  const equationFound = EQUATION_CHECKS.filter((c) => c.test(equation));

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Screwy Pirates</p>
      <h1 className="pirate-story-line answer-title">Work out the split</h1>
      <p className="pirate-story-line answer-subtitle">
        Pick a crew size, then fill in what each pirate keeps. The most senior pirate — the highest number —
        is the one proposing.
      </p>

      <div className="answer-crew-picker">
        {CREW_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className={crewSize === size ? "chip-btn active" : "chip-btn"}
            onClick={() => selectCrewSize(size)}
          >
            {size} pirate{size > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      {crewSize !== null && (
        <>
          <div className="answer-rows">
            {pirateOrder.map((pirateNumber) => {
              const isSenior = pirateNumber === crewSize;
              const isCorrect = showResults && Number(amounts[pirateNumber]) === answerKey[pirateNumber];
              const isWrong = showResults && !isCorrect;
              const rowClass = isCorrect ? "answer-row is-correct" : isWrong ? "answer-row is-wrong" : "answer-row";

              return (
                <div className={rowClass} key={pirateNumber}>
                  <PixelPirateIcon pirateNumber={pirateNumber} senior={isSenior} />
                  <div className="answer-row-label">
                    <span className="answer-row-title">
                      Pirate {pirateNumber}
                      {isSenior && <span className="answer-row-tag">Senior — proposes</span>}
                    </span>
                    <span className="answer-row-hint">keeps</span>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    className="answer-input"
                    placeholder="0"
                    value={amounts[pirateNumber] ?? ""}
                    onChange={(event) => setAmount(pirateNumber, event.target.value)}
                  />
                  <span className="answer-input-suffix">coins</span>
                  {showResults && (
                    <span className={isCorrect ? "answer-row-mark is-correct" : "answer-row-mark is-wrong"}>
                      {isCorrect ? "✓" : `✗ → ${answerKey[pirateNumber]}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className={total === 100 ? "answer-total is-complete" : "answer-total"}>
            Total: {total} / 100 coins
          </p>

          <div className="answer-field">
            <label htmlFor="answer-explanation">Explain how you got your answer, and why.</label>
            <textarea
              id="answer-explanation"
              className="answer-textarea"
              rows={5}
              placeholder="Walk through your reasoning here..."
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </div>

          <div className="answer-field">
            <label htmlFor="answer-equation">Equation for the pattern you found.</label>
            <input
              id="answer-equation"
              type="text"
              className="answer-equation-input"
              placeholder="e.g. keep(n) = 100 - floor((n - 1) / 2)"
              value={equation}
              onChange={(event) => setEquation(event.target.value)}
            />
          </div>

          <button type="button" className="continue-btn answer-check-btn" onClick={() => setShowResults(true)}>
            Check my answer
          </button>

          {showResults && (
            <div className="answer-results">
              <p className="answer-results-score">
                Coins: {coinsCorrectCount} / {crewSize} correct
              </p>

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

              <div className="answer-checklist">
                <p className="answer-checklist-title">
                  Equation — {equationFound.length} / {EQUATION_CHECKS.length} pieces found
                </p>
                <ul>
                  {EQUATION_CHECKS.map((c) => (
                    <li key={c.label} className={equationFound.includes(c) ? "is-found" : "is-missing"}>
                      {equationFound.includes(c) ? "✓" : "○"} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showResults && (
            <a href="/brain-teasers/screwy-pirates/breakdown" className="continue-btn answer-next-btn">
              Full breakdown &amp; explanation →
            </a>
          )}
        </>
      )}
    </div>
  );
}
