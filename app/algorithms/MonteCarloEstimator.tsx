"use client";

import { useState } from "react";
import { piEstimatorStdDev, samplePiEstimate } from "./algoMath";

const N_OPTIONS = [100, 500, 2000, 10000, 50000];

export default function MonteCarloEstimator() {
  const [nIndex, setNIndex] = useState(0);
  const [result, setResult] = useState<{ estimate: number; inside: number; n: number } | null>(null);
  const [history, setHistory] = useState<{ n: number; estimate: number }[]>([]);
  const [guessHalve, setGuessHalve] = useState("");
  const [revealedHalve, setRevealedHalve] = useState(false);

  const n = N_OPTIONS[nIndex];
  const sd = piEstimatorStdDev();
  const currentSE = result ? sd / Math.sqrt(result.n) : null;

  function run() {
    const { estimate, inside } = samplePiEstimate(n);
    setResult({ estimate, inside, n });
    setHistory((h) => [...h.slice(-7), { n, estimate }]);
  }

  // How many samples for the standard error to drop to half of the current
  // SE — the classic "quadruple your paths to halve your error" fact,
  // computed from the actual sample size rather than asserted.
  const trueMultiplierToHalve = 4; // SE ∝ 1/√N, so halving SE needs 4× the samples

  function revealHalve() {
    setRevealedHalve(true);
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Estimate π by throwing random points in a unit square and checking how many land inside the inscribed
        circle: P(inside) = π/4, so 4 × (fraction inside) → π. Run it, then predict how many more samples it takes
        to cut your error in half.
      </p>

      <div className="algo-mc-controls">
        <span className="calc-slider-label">Samples</span>
        <input
          type="range"
          min={0}
          max={N_OPTIONS.length - 1}
          step={1}
          value={nIndex}
          onChange={(e) => setNIndex(Number(e.target.value))}
          className="calc-slider"
        />
        <span className="calc-slider-value">{n.toLocaleString()}</span>
        <button type="button" className="calc-submit-btn" onClick={run}>Run simulation</button>
      </div>

      {result && (
        <div className="algo-mc-readout">
          <div className="calc-taylor-readout">
            <div>
              <span className="calc-comp-label">Points inside</span>
              <span className="calc-comp-val">{result.inside.toLocaleString()} / {result.n.toLocaleString()}</span>
            </div>
            <div>
              <span className="calc-comp-label">Estimate</span>
              <span className="calc-comp-val">{result.estimate.toFixed(5)}</span>
            </div>
            <div>
              <span className="calc-comp-label">True π</span>
              <span className="calc-comp-val">{Math.PI.toFixed(5)}</span>
            </div>
            <div>
              <span className="calc-comp-label">Standard error</span>
              <span className="calc-comp-val">{currentSE?.toFixed(5)}</span>
            </div>
          </div>

          <div className="algo-mc-history">
            {history.map((h, i) => (
              <span key={i} className="algo-mc-history-chip">
                N={h.n.toLocaleString()} → {h.estimate.toFixed(4)}
              </span>
            ))}
          </div>

          <div className="algo-mc-halve">
            <p className="calc-taylor-target">
              Standard error scales like 1/√N. To cut this run's SE in half, how many <strong>times more</strong>{" "}
              samples do you need?
            </p>
            {!revealedHalve ? (
              <div className="calc-input-row">
                <input
                  type="text"
                  className="calc-input"
                  value={guessHalve}
                  onChange={(e) => setGuessHalve(e.target.value)}
                  placeholder="e.g. 2, 4, 10"
                  autoComplete="off"
                  inputMode="numeric"
                />
                <button type="button" className="calc-submit-btn" onClick={revealHalve}>Check</button>
              </div>
            ) : (
              <p
                className={
                  Number(guessHalve) === trueMultiplierToHalve ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"
                }
              >
                SE = s/√N, so halving SE means quadrupling N - the answer is always{" "}
                <strong>{trueMultiplierToHalve}×</strong>, regardless of the current N. Going from{" "}
                {result.n.toLocaleString()} to {(result.n * trueMultiplierToHalve).toLocaleString()} samples would
                roughly halve this run's error.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
