"use client";

import { useState } from "react";
import { randomDPPuzzle, type DPPuzzle } from "./algoMath";
import { useClientRound } from "./useClientRound";
import { AccessStartButton } from "../access/TokenPlayButton";

type CellState = "given" | "empty" | "correct" | "wrong";

export default function DPBuilder() {
  const [puzzle, nextPuzzle] = useClientRound(randomDPPuzzle);
  const [filled, setFilled] = useState<number[]>([]); // player-confirmed values, index-aligned up to current
  const [cellStates, setCellStates] = useState<CellState[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);

  if (!puzzle) return <div className="calc-subgame calc-loading">Loading a fresh puzzle…</div>;

  const total = puzzle.table.length;
  const currentIndex = filled.length + puzzle.baseCases;
  const isComplete = currentIndex >= total;

  function submit() {
    if (isComplete || input.trim() === "") return;
    const guess = Number(input);
    const correct = puzzle!.table[currentIndex];
    const isRight = !isNaN(guess) && guess === correct;
    setCellStates((s) => [...s, isRight ? "correct" : "wrong"]);
    setFilled((f) => [...f, correct]);
    if (isRight) setScore((s) => s + 1);
    setInput("");
  }

  function next() {
    nextPuzzle();
    setFilled([]);
    setCellStates([]);
    setInput("");
    setScore(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Fill in the memo table left to right, one cell at a time. The base cases are given - every other cell
        follows from the recurrence below.
      </p>

      <div className="algo-dp-header">
        <p className="algo-dp-title">{puzzle.title}</p>
        <p className="algo-dp-prompt">{puzzle.prompt}</p>
        <code className="algo-dp-recurrence">{puzzle.recurrence}</code>
      </div>

      <div className="lab-hud">
        <span>FILLED <strong>{filled.length}/{total - puzzle.baseCases}</strong></span>
        <span>CORRECT <strong>{score}</strong></span>
      </div>

      <div className="algo-dp-table">
        {puzzle.table.map((value, i) => {
          const isGiven = i < puzzle.baseCases;
          const isFilled = i < currentIndex && !isGiven;
          const state: CellState = isGiven ? "given" : isFilled ? cellStates[i - puzzle.baseCases] : "empty";
          const isActive = i === currentIndex && !isComplete;
          return (
            <div key={i} className={`algo-dp-cell is-${state}${isActive ? " is-active" : ""}`}>
              <span className="algo-dp-cell-label">{puzzle.cellLabel(i)}</span>
              <span className="algo-dp-cell-value">
                {isGiven || isFilled ? value : isActive ? "?" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {!isComplete ? (
        <div className="calc-input-row">
          <input
            type="text"
            className="calc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Value for ${puzzle.cellLabel(currentIndex)}`}
            autoComplete="off"
            inputMode="numeric"
          />
          <button type="button" className="calc-submit-btn" onClick={submit}>Fill cell</button>
        </div>
      ) : (
        <div className="calc-reveal">
          <p className={score === total - puzzle.baseCases ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            Table complete: {score}/{total - puzzle.baseCases} cells correct on the first try. Final answer:{" "}
            <strong>{puzzle.table[total - 1] === 1e9 ? "impossible" : puzzle.table[total - 1]}</strong>.
          </p>
          <AccessStartButton gameId="algorithms-dp-table-builder" title="DP Table Builder" defaultLabel="Next puzzle" className="continue-btn" onStart={next}>
            Next puzzle →
          </AccessStartButton>
        </div>
      )}
    </div>
  );
}
