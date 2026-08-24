"use client";

import { useEffect, useState } from "react";
import "./sequence.css";

type PatternKind = "arithmetic" | "geometric" | "squares" | "alternating" | "fibonacci";

type SequenceRound = {
  values: number[];
  answer: number;
  rule: string;
  kind: PatternKind;
};

type Result = {
  correct: boolean;
  guess: number;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function buildSequenceRound(): SequenceRound {
  const kind = (['arithmetic', 'geometric', 'squares', 'alternating', 'fibonacci'] as PatternKind[])[randomInt(0, 4)];

  if (kind === "arithmetic") {
    const start = randomInt(-12, 12);
    const step = [-9, -7, -5, -4, -3, 2, 3, 4, 5, 7, 9][randomInt(0, 10)];
    const values = Array.from({ length: 5 }, (_, i) => start + i * step);
    return { values, answer: start + 5 * step, rule: `Add ${signed(step)} each time`, kind };
  }

  if (kind === "geometric") {
    const start = randomInt(2, 6);
    const ratio = randomInt(0, 1) === 0 ? 2 : 3;
    const values = Array.from({ length: 4 }, (_, i) => start * ratio ** i);
    return { values, answer: start * ratio ** 4, rule: `Multiply by ${ratio} each time`, kind };
  }

  if (kind === "squares") {
    const start = randomInt(1, 5);
    const values = Array.from({ length: 5 }, (_, i) => (start + i) ** 2);
    return { values, answer: (start + 5) ** 2, rule: `Consecutive squares: ${start}^2, ${start + 1}^2, ...`, kind };
  }

  if (kind === "alternating") {
    const start = randomInt(-4, 8);
    const rise = randomInt(2, 8);
    const fall = randomInt(1, 6);
    const values = Array.from({ length: 6 }, (_, i) => {
      let value = start;
      for (let step = 0; step < i; step += 1) value += step % 2 === 0 ? rise : -fall;
      return value;
    });
    return { values, answer: values[values.length - 1] + rise, rule: `Alternate ${signed(rise)}, ${signed(-fall)}`, kind };
  }

  const first = randomInt(1, 8);
  const second = randomInt(1, 8);
  const values = [first, second];
  while (values.length < 6) values.push(values[values.length - 1] + values[values.length - 2]);
  return { values: values.slice(0, 5), answer: values[5], rule: "Add the previous two numbers", kind };
}

function formatValue(value: number): string {
  return value.toLocaleString("en-US");
}

export default function SequenceGame() {
  const [round, setRound] = useState<SequenceRound | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    setRound(buildSequenceRound());
  }, []);

  function submit() {
    if (!round || result || input.trim() === "") return;
    const guess = Number(input);
    const correct = Number.isFinite(guess) && guess === round.answer;
    setResult({ correct, guess });
    setRounds((value) => value + 1);
    if (correct) {
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }
  }

  function nextRound() {
    setRound(buildSequenceRound());
    setInput("");
    setResult(null);
  }

  if (!round) return <div className="answer-content sequence-game"><p className="qty-hint">Loading a fresh sequence...</p></div>;

  return (
    <div className="answer-content sequence-game">
      <p className="pirate-kicker">Drill Lab // Pattern recognition</p>
      <h1 className="pirate-story-line answer-title">Sequence Sprint</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        Find the rule, then enter the next number. The patterns are generated fresh each round.
      </p>

      <div className="lab-hud sequence-hud">
        <span>SOLVED <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span>STREAK <strong>{streak}</strong></span>
      </div>

      <div className="pixel-stage sequence-stage">
        <p className="sequence-prompt">What comes next?</p>
        <div className="sequence-values" aria-label="Number sequence">
          {round.values.map((value, index) => (
            <span className="sequence-value" key={`${value}-${index}`}>{formatValue(value)}</span>
          ))}
          <span className="sequence-value sequence-unknown" aria-label="Unknown next value">?</span>
        </div>

        {!result ? (
          <form className="sequence-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <label htmlFor="sequence-answer" className="sequence-label">Next number</label>
            <div className="sequence-input-row">
              <input
                id="sequence-answer"
                className="sequence-input"
                type="number"
                inputMode="numeric"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="?"
                autoFocus
              />
              <button type="submit" className="continue-btn sequence-submit">Check</button>
            </div>
          </form>
        ) : (
          <div className={result.correct ? "sequence-feedback is-correct" : "sequence-feedback is-wrong"}>
            <p className="sequence-verdict">{result.correct ? "Correct" : "Not quite"}</p>
            {!result.correct && <p>Your answer: <strong>{formatValue(result.guess)}</strong></p>}
            <p>Next number: <strong>{formatValue(round.answer)}</strong></p>
            <p className="sequence-rule">Rule: {round.rule}</p>
            <button type="button" className="continue-btn sequence-submit" onClick={nextRound}>Next sequence</button>
          </div>
        )}
      </div>
    </div>
  );
}
