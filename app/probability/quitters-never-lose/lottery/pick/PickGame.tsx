"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildPickTemplate, checkResult, drawDigits, type PickResult, type PickTemplate } from "./pickMath";
import { PICK_QUESTION_BANK } from "./pickQuestions";
import { DigitTile, ResultBanner } from "./PixelArt";

const DIGIT_ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const WAGER = 1;

// Reveal one drawn digit at a time, then hold a beat before showing results.
const REVEAL_STEP_MS = 650;
const RESULTS_DELAY_MS = 500;

function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [a, b] = trimmed.split("/").map((s) => Number(s.trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }
  const n = Number(trimmed.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

type Phase = "pick" | number | "reveal" | "results";

export default function PickGame() {
  const searchParams = useSearchParams();
  const nParam = Number(searchParams.get("n"));
  const n: 3 | 4 | 5 = nParam === 4 ? 4 : nParam === 5 ? 5 : 3; // default Pick 3

  const [phase, setPhase] = useState<Phase>("pick");
  const [digits, setDigits] = useState<(number | null)[]>(() => Array(n).fill(null));
  const [template, setTemplate] = useState<PickTemplate | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<number, string>>>({});
  const [checked, setChecked] = useState<Partial<Record<number, boolean>>>({});
  const [drawn, setDrawn] = useState<number[]>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [result, setResult] = useState<PickResult | null>(null);

  // Dispenser reveal — a self-chaining relative timer (each tick schedules
  // the next one), same pattern used everywhere else on the site so a Skip
  // click can't leave a stale timer that fires later and regresses state.
  useEffect(() => {
    if (phase !== "reveal") return;
    if (revealCount >= n) {
      const t = setTimeout(() => {
        setResult(checkResult(template!, drawn));
        setPhase("results");
      }, RESULTS_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealCount((c) => c + 1), REVEAL_STEP_MS);
    return () => clearTimeout(t);
  }, [phase, revealCount, n, template, drawn]);

  const pickDigit = (col: number, d: number) => {
    if (phase !== "pick") return;
    setDigits((prev) => {
      const next = [...prev];
      next[col] = d;
      return next;
    });
  };

  const lockInTicket = () => {
    if (digits.some((d) => d === null)) return;
    const t = buildPickTemplate(digits as number[]);
    setTemplate(t);
    setPhase(0);
  };

  const setAnswer = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const checkQuestion = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: true }));
  };

  const nextQuestion = () => {
    const idx = phase as number;
    if (idx < PICK_QUESTION_BANK.length - 1) {
      setPhase(idx + 1);
    } else {
      setDrawn(drawDigits(n));
      setRevealCount(0);
      setPhase("reveal");
    }
  };

  const skipReveal = () => setRevealCount(n);

  const playAgain = () => {
    setPhase("pick");
    setDigits(Array(n).fill(null));
    setTemplate(null);
    setAnswers({});
    setChecked({});
    setDrawn([]);
    setRevealCount(0);
    setResult(null);
  };

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quitters Never Lose</p>
      <h1 className="pirate-story-line answer-title">Pick {n}</h1>

      {phase === "pick" && (
        <div className="pixel-stage" style={{ marginTop: 16 }}>
          <p className="quiz-panel-title" style={{ marginBottom: 16 }}>
            Fill in one digit per column - this is your ticket. ${WAGER} wager.
          </p>
          <div className="pick-ticket-grid">
            {Array.from({ length: n }, (_, col) => (
              <div className="pick-ticket-col" key={col}>
                <p className="pick-ticket-col-label">#{col + 1}</p>
                {DIGIT_ROWS.map((d) => (
                  <DigitTile
                    key={d}
                    digit={d}
                    state={digits[col] === d ? "selected" : "idle"}
                    onClick={() => pickDigit(col, d)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="continue-btn"
            style={{ marginTop: 20 }}
            disabled={digits.some((d) => d === null)}
            onClick={lockInTicket}
          >
            Lock in ticket
          </button>
        </div>
      )}

      {template && typeof phase === "number" && (
        <PickQuestionCard
          template={template}
          index={phase}
          answers={answers}
          checked={checked}
          onAnswerChange={(v) => setAnswer(phase, v)}
          onCheck={() => checkQuestion(phase)}
          onNext={nextQuestion}
        />
      )}

      {template && phase === "reveal" && (
        <div className="pixel-stage" style={{ marginTop: 16, textAlign: "center" }}>
          <p className="quiz-panel-title" style={{ marginBottom: 8 }}>
            Drawing your numbers...
          </p>
          <div className="pick-dispenser-row">
            {Array.from({ length: n }, (_, i) => (
              <DigitTile
                key={i}
                digit={i < revealCount ? drawn[i] : "?"}
                state={i < revealCount ? "locked" : "idle"}
                revealed={i === revealCount - 1}
              />
            ))}
          </div>
          {revealCount < n && (
            <button type="button" className="chip-btn" onClick={skipReveal}>
              Skip
            </button>
          )}
        </div>
      )}

      {template && result && phase === "results" && (
        <PickResults template={template} drawn={drawn} result={result} onPlayAgain={playAgain} n={n} />
      )}
    </div>
  );
}

function PickQuestionCard({
  template,
  index,
  answers,
  checked,
  onAnswerChange,
  onCheck,
  onNext,
}: {
  template: PickTemplate;
  index: number;
  answers: Partial<Record<number, string>>;
  checked: Partial<Record<number, boolean>>;
  onAnswerChange: (v: string) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const q = PICK_QUESTION_BANK[index];
  const { decimal, tolerance, display } = q.answer(template);
  const prompt = q.prompt(template);
  const explanation = q.explanation(template);

  const rawAnswer = answers[index] ?? "";
  const isChecked = !!checked[index];
  const parsed = parseAnswer(rawAnswer);
  const isCorrect = isChecked && parsed !== null && Math.abs(parsed - decimal) <= tolerance;

  return (
    <div className="quiz-panel" style={{ marginTop: 16 }}>
      <p className="quiz-panel-title">
        Question {index + 1} of {PICK_QUESTION_BANK.length}
      </p>
      <div className={isChecked ? (isCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
        <p className="quiz-q-topic">{q.topicLabel}</p>
        <p className="quiz-q-prompt">{prompt}</p>
        <div className="quiz-q-input-row">
          <input
            type="text"
            className="quiz-q-input"
            placeholder="type your answer"
            value={rawAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={isChecked}
          />
          {!isChecked && (
            <button type="button" className="chip-btn" onClick={onCheck} disabled={!rawAnswer}>
              Check
            </button>
          )}
        </div>
        {isChecked && (
          <p className={isCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            {isCorrect ? "✓ Correct. " : `✗ Not quite - the answer is ${display}. `}
            {explanation}
          </p>
        )}
      </div>
      {isChecked && (
        <button type="button" className="continue-btn" onClick={onNext}>
          {index < PICK_QUESTION_BANK.length - 1 ? "Next question" : "Draw the numbers"}
        </button>
      )}
    </div>
  );
}

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function PickResults({
  template,
  drawn,
  result,
  onPlayAgain,
  n,
}: {
  template: PickTemplate;
  drawn: number[];
  result: PickResult;
  onPlayAgain: () => void;
  n: number;
}) {
  const rows = [
    { key: "straight", name: "Straight", odds: template.straightProbFraction, payout: template.straightPayout, hit: result.straightHit },
    { key: "box", name: `Box (${template.wayLabel})`, odds: template.boxProbFraction, payout: template.boxPayout, hit: result.boxHit },
    { key: "pair", name: "Front Pair", odds: template.pairProbFraction, payout: template.pairPayout, hit: result.pairHit },
  ];
  if (template.frontBackK) {
    rows.push({
      key: "front",
      name: `Front ${template.frontBackK}`,
      odds: template.frontBackProbFraction!,
      payout: template.frontBackPayout!,
      hit: result.frontHit,
    });
    rows.push({
      key: "back",
      name: `Back ${template.frontBackK}`,
      odds: template.frontBackProbFraction!,
      payout: template.frontBackPayout!,
      hit: result.backHit,
    });
  }

  const totalWon = rows.reduce((sum, r) => sum + (r.hit ? r.payout : 0), 0);
  const anyHit = totalWon > 0;

  return (
    <div className="pixel-stage" style={{ marginTop: 16 }}>
      <div className="pick-ticket-readout">
        {template.digits.map((d, i) => (
          <DigitTile key={i} digit={d} state="selected" disabled />
        ))}
      </div>
      <p className="quiz-panel-title" style={{ marginBottom: 4 }}>
        Drawn: {drawn.join(" · ")}
      </p>

      <ResultBanner
        outcome={anyHit ? "win" : "loss"}
        title={anyHit ? "YOU WON" : "NO MATCH"}
        sub={anyHit ? `Total: ${money(totalWon)} on a $${WAGER} ticket` : `You spent $${WAGER} on this ticket`}
      />

      <div className="pick-playtype-list">
        {rows.map((r) => (
          <div className={r.hit ? "pick-playtype-row is-hit" : "pick-playtype-row"} key={r.key}>
            <div>
              <p className="pick-playtype-name">{r.name}</p>
              <p className="pick-playtype-odds">
                odds {r.odds} · pays {money(r.payout)}
              </p>
            </div>
            <span className={r.hit ? "pick-playtype-status is-win" : "pick-playtype-status is-miss"}>
              {r.hit ? "WIN" : "no match"}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="chip-btn" onClick={onPlayAgain}>
        Play another Pick {n} ticket
      </button>
    </div>
  );
}
