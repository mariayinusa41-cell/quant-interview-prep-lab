"use client";

import { useState } from "react";
import {
  bfReserve,
  cdfFrom,
  chainLadder,
  linkRatios,
  type Triangle,
} from "../reservingMath";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

// Cumulative paid claims, in thousands. Rows are origin years, columns are
// development years. The newest origin year has only one figure, which is
// exactly where reserving is hardest.
const TRIANGLE: Triangle = [
  [1000, 1500, 1750, 1875, 1900],
  [1100, 1650, 1925, 2062],
  [1200, 1800, 2100],
  [1300, 1950],
  [1400],
];

const ORIGIN_YEARS = [2021, 2022, 2023, 2024, 2025];

// A-priori inputs for the Bornhuetter-Ferguson stage.
const PREMIUM = 2600;
const EXPECTED_LOSS_RATIO = 0.72;

const LDF_TOLERANCE = 0.01;
const RESERVE_TOLERANCE = 40;

type Phase = "brief" | "ldf" | "reserve" | "bf" | "done";

export default function LossTriangleGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [phase, setPhase] = useState<Phase>("brief");
  const [ldfInputs, setLdfInputs] = useState<string[]>(["", "", "", ""]);
  const [ldfChecked, setLdfChecked] = useState(false);
  const [reserveInput, setReserveInput] = useState("");
  const [reserveChecked, setReserveChecked] = useState(false);
  const [bfChoice, setBfChoice] = useState<"cl" | "bf" | null>(null);
  const [bfInput, setBfInput] = useState("");
  const [bfChecked, setBfChecked] = useState(false);
  const [score, setScore] = useState(0);

  const truth = chainLadder(TRIANGLE);
  const ratios = linkRatios(TRIANGLE);
  const maxDev = Math.max(...TRIANGLE.map((r) => r.length));

  // The newest origin year is only one period developed, so its CDF is the
  // product of every remaining link ratio — the classic "leverage" problem.
  const newestCdf = cdfFrom(ratios, 0);
  const newestLatest = TRIANGLE[4][0];
  const bfAnswer = bfReserve(newestCdf, PREMIUM, EXPECTED_LOSS_RATIO);
  const clAnswer = newestLatest * newestCdf - newestLatest;

  const start = () => {
    setPhase("ldf");
    startMusic("game");
  };

  function checkLdfs() {
    if (ldfChecked) return;
    let correct = 0;
    ratios.forEach((r, i) => {
      const guess = Number(ldfInputs[i]);
      const ok = ldfInputs[i].trim() !== "" && Math.abs(guess - r) <= LDF_TOLERANCE;
      if (ok) correct += 1;
      recordAttempt("distributions", ok ? "correct" : "incorrect");
    });
    playSfx(correct === ratios.length ? "correct" : "wrong");
    setScore((s) => s + correct);
    setLdfChecked(true);
  }

  function checkReserve() {
    if (reserveChecked) return;
    const guess = Number(reserveInput);
    const ok = reserveInput.trim() !== "" && Math.abs(guess - truth.totalReserve) <= RESERVE_TOLERANCE;
    recordAttempt("expected-value", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    setReserveChecked(true);
  }

  function checkBf() {
    if (bfChecked || bfChoice === null) return;
    const methodOk = bfChoice === "bf";
    const guess = Number(bfInput);
    const valueOk = bfInput.trim() !== "" && Math.abs(guess - bfAnswer) <= RESERVE_TOLERANCE;
    recordAttempt("selection-bias", methodOk ? "correct" : "incorrect");
    recordAttempt("expected-value", valueOk ? "correct" : "incorrect");
    playSfx(methodOk && valueOk ? "correct" : "wrong");
    if (methodOk) setScore((s) => s + 1);
    if (valueOk) setScore((s) => s + 2);
    setBfChecked(true);
  }

  if (phase === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">Claims already happened. Most of the money has not been paid yet.</p>
          <p>
            This is a run-off triangle: cumulative claims paid, by origin year (rows) and development
            year (columns). The upper-left is history. The lower-right is your problem — money you
            owe but have not paid, and must hold reserves against today.
          </p>
          <div className="lab-topic-grid">
            {[
              ["LINK RATIOS", "how claims mature"],
              ["CHAIN LADDER", "project to ultimate"],
              ["IBNR", "ultimate minus paid"],
              ["BORNHUETTER-FERGUSON", "when the data is thin"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Interview lens: every reserving interview starts here. Get the link ratios right, then
            know the one situation where chain ladder blows up.
          </p>
          <AccessStartButton
            gameId="actuarial-loss-triangle"
            title="Loss Triangle Labyrinth"
            defaultLabel="Open the triangle"
            className="continue-btn"
            onStart={start}
          >
            Open the triangle
          </AccessStartButton>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>PHASE <strong>{phase === "ldf" ? "1/3" : phase === "reserve" ? "2/3" : "3/3"}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span>ELR <strong>{Math.round(EXPECTED_LOSS_RATIO * 100)}%</strong></span>
      </div>

      {/* ---------- The triangle ---------- */}
      <div className="tri-wrap">
        <table className="tri-table">
          <thead>
            <tr>
              <th scope="col">Origin</th>
              {Array.from({ length: maxDev }).map((_, j) => (
                <th scope="col" key={j}>Dev {j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRIANGLE.map((row, i) => (
              <tr key={ORIGIN_YEARS[i]}>
                <th scope="row">{ORIGIN_YEARS[i]}</th>
                {Array.from({ length: maxDev }).map((_, j) => (
                  <td key={j} className={j < row.length ? "tri-known" : "tri-unknown"}>
                    {j < row.length ? row[j].toLocaleString() : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tri-note">Cumulative paid claims, thousands. Dashes are unpaid future development.</p>
      </div>

      {/* ---------- Phase 1: link ratios ---------- */}
      {phase === "ldf" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 1 — volume-weighted link ratios</p>
          <p className="mm-step-hint">
            For each step, add up every origin year where <em>both</em> columns are known, then
            divide.
          </p>
          <div className="mutiny-formula">LDF<sub>j</sub> = Σ C[i][j+1] ÷ Σ C[i][j]</div>

          <div className="tri-ldf-grid">
            {ratios.map((r, i) => (
              <label className="tri-ldf-cell" key={i}>
                <span>Dev {i} → {i + 1}</span>
                <input
                  type="text"
                  className="calc-input"
                  inputMode="decimal"
                  value={ldfInputs[i]}
                  disabled={ldfChecked}
                  placeholder="e.g. 1.25"
                  onChange={(e) => {
                    const next = [...ldfInputs];
                    next[i] = e.target.value;
                    setLdfInputs(next);
                  }}
                />
                {ldfChecked && (
                  <em className={Math.abs(Number(ldfInputs[i]) - r) <= LDF_TOLERANCE ? "is-ok" : "is-no"}>
                    {r.toFixed(4)}
                  </em>
                )}
              </label>
            ))}
          </div>

          {!ldfChecked ? (
            <button type="button" className="calc-submit-btn" onClick={checkLdfs}>Check ratios</button>
          ) : (
            <>
              <p className="quiz-q-explain is-correct">
                Each ratio is a weighted average, not a simple mean — a large mature year should
                carry more weight than a tiny immature one.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("reserve")}>
                Next: project the reserve →
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------- Phase 2: total reserve ---------- */}
      {phase === "reserve" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 2 — total chain ladder reserve</p>
          <p className="mm-step-hint">
            Push each origin year out to ultimate with the ratios, then subtract what is already
            paid. The reserve is what you have <em>not</em> paid yet.
          </p>
          <div className="mutiny-formula">Reserve = Σ ( latest<sub>i</sub> × CDF<sub>i</sub> − latest<sub>i</sub> )</div>

          <div className="tri-cdf-row">
            {TRIANGLE.map((row, i) => (
              <span key={i}>
                {ORIGIN_YEARS[i]}: CDF <strong>{cdfFrom(ratios, row.length - 1).toFixed(4)}</strong>
              </span>
            ))}
          </div>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={reserveInput}
              disabled={reserveChecked}
              placeholder="Total reserve, thousands"
              onChange={(e) => setReserveInput(e.target.value)}
            />
            {!reserveChecked && (
              <button type="button" className="calc-submit-btn" onClick={checkReserve}>Check</button>
            )}
          </div>

          {reserveChecked && (
            <>
              <p
                className={
                  Math.abs(Number(reserveInput) - truth.totalReserve) <= RESERVE_TOLERANCE
                    ? "quiz-q-explain is-correct"
                    : "quiz-q-explain is-wrong"
                }
              >
                Total reserve is <strong>{truth.totalReserve.toFixed(0)}</strong>. By origin year:{" "}
                {truth.reserves.map((r, i) => `${ORIGIN_YEARS[i]}: ${r.toFixed(0)}`).join(" · ")}.
                Note 2021 is fully developed, so it needs nothing.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("bf")}>
                Next: the thin year →
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------- Phase 3: BF ---------- */}
      {phase === "bf" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 3 — the year with almost no data</p>
          <p className="mm-step-hint">
            2025 has exactly one figure ({newestLatest.toLocaleString()}), and its CDF is{" "}
            <strong>{newestCdf.toFixed(4)}</strong>. Chain ladder multiplies that single number by
            almost 1.9 — so any noise in it gets amplified straight into your reserve. Premium for
            2025 is {PREMIUM.toLocaleString()} and the a-priori loss ratio is{" "}
            {Math.round(EXPECTED_LOSS_RATIO * 100)}%.
          </p>

          <div className="calc-choice-grid">
            <button
              type="button"
              className={bfChoice === "cl" ? "calc-choice is-selected" : "calc-choice"}
              disabled={bfChecked}
              onClick={() => setBfChoice("cl")}
            >
              Stay with chain ladder
            </button>
            <button
              type="button"
              className={bfChoice === "bf" ? "calc-choice is-selected" : "calc-choice"}
              disabled={bfChecked}
              onClick={() => setBfChoice("bf")}
            >
              Switch to Bornhuetter-Ferguson
            </button>
          </div>

          <div className="mutiny-formula">BF reserve = ( 1 − 1 ÷ CDF ) × premium × ELR</div>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={bfInput}
              disabled={bfChecked}
              placeholder="2025 reserve, thousands"
              onChange={(e) => setBfInput(e.target.value)}
            />
            {!bfChecked && (
              <button type="button" className="calc-submit-btn" disabled={bfChoice === null} onClick={checkBf}>
                Check
              </button>
            )}
          </div>

          {bfChecked && (
            <>
              <p className={bfChoice === "bf" ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                {bfChoice === "bf" ? "Right call. " : "Chain ladder is the fragile choice here. "}
                BF reserve is <strong>{bfAnswer.toFixed(0)}</strong> versus chain ladder&rsquo;s{" "}
                <strong>{clAnswer.toFixed(0)}</strong>.
              </p>
              <p className="quiz-q-explain">
                BF is exactly a credibility blend: Z × chain ladder + (1 − Z) × a-priori, with Z ={" "}
                {(1 / newestCdf).toFixed(3)} — the share of losses you would expect to have paid by
                now. Because it applies the pattern to an independent expectation instead of scaling
                up one noisy figure, it always sits between the two and leans on the a-priori
                whenever the year is barely developed.
              </p>
              <AccessStartButton
                gameId="actuarial-loss-triangle"
                title="Loss Triangle Labyrinth"
                defaultLabel="Run it again"
                className="continue-btn"
                onStart={() => {
                  setPhase("ldf");
                  setLdfInputs(["", "", "", ""]);
                  setLdfChecked(false);
                  setReserveInput("");
                  setReserveChecked(false);
                  setBfChoice(null);
                  setBfInput("");
                  setBfChecked(false);
                }}
              >
                Run it again
              </AccessStartButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
