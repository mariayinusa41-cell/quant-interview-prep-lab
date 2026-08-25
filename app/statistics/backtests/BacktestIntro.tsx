"use client";

import { useState } from "react";
import { AccessStartButton } from "../../access/TokenPlayButton";

const STEPS = [
  {
    term: "The job",
    body: "You allocate capital. Twenty analysts each bring you a strategy and a backtest. One curve looks beautiful. Do you fund it?",
    note: "You can also fund none - and sometimes that's the only right answer.",
  },
  {
    term: "A backtest is an estimate",
    body: "A Sharpe ratio computed from history is a noisy guess at the real one. With one year of daily data its standard error is about 1.0 - so a backtested Sharpe of 1.0 over a year is statistically indistinguishable from zero skill.",
    note: "Standard error of an annualised Sharpe ≈ √(252 / days).",
  },
  {
    term: "Now take the best of twenty",
    body: "Run twenty strategies with genuinely zero edge and the luckiest one is expected to post a Sharpe around 1.9 on a one-year backtest. Not because it works - because you picked the maximum of twenty noisy numbers.",
    note: "This is selection bias, and it is the single most common way a real desk loses money.",
  },
  {
    term: "So ask two questions",
    body: "First: how many were tried to find this one? Second: what would the best have looked like if none of them worked? If the winner isn't clearly beyond that, you've found luck, not skill.",
    note: "The no-edge benchmark button does that arithmetic for you.",
  },
  {
    term: "The only real test",
    body: "Data the strategy never saw. Real edge persists out of sample; selection artefacts collapse to zero. After every decision you'll see exactly that happen.",
  },
];

export default function BacktestIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Twenty Backtests</h1>
      <div className="pixel-stage">
        <p className="mm-teach-progress">
          {step + 1} / {STEPS.length}
        </p>
        <p className="mm-teach-term">{current.term}</p>
        <div className="hs-tutorial-step">
          <p>{current.body}</p>
        </div>
        {current.note && <p className="mm-teach-note">{current.note}</p>}
        <div className="mm-teach-nav">
          {step > 0 && (
            <button type="button" className="hs-chunky-btn is-secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {isLast ? (
            <AccessStartButton gameId="statistics-twenty-backtests" title="Twenty Backtests" defaultLabel="Start" className="hs-chunky-btn" onStart={onDone}>
              Start
            </AccessStartButton>
          ) : (
            <button type="button" className="hs-chunky-btn" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
