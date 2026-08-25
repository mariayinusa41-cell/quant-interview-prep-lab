"use client";

import { useState } from "react";
import { AccessStartButton } from "../../access/TokenPlayButton";

const STEPS = [
  {
    term: "The job",
    body: "Something is generating numbers. You get to see them - as a histogram - and you have to work out which distribution is behind it.",
    note: "Six candidates. The shape is your only evidence.",
  },
  {
    term: "Shape tells",
    body: "Symmetric bell with no hard edges: normal. Flat with hard edges at both ends: uniform. Starts high at zero and decays: exponential. Positive with a long right tail: lognormal.",
    note: "Skew is the fastest discriminator - near 0 means symmetric, above 1 means a long right tail.",
  },
  {
    term: "Counts vs. measurements",
    body: "Two of the six are discrete counts. Binomial is bounded - you can't get more than n successes out of n trials. Poisson is unbounded above, and has one unmistakable signature.",
    note: "Poisson's tell: mean ≈ variance. Nothing else does that.",
  },
  {
    term: "Then the formula",
    body: "Identify it and you'll be shown the parameters and asked for the mean or the variance. Knowing the shape isn't enough - interviews want E[X] and Var(X) on demand.",
  },
  {
    term: "The last round",
    body: "The finale isn't an identification. You'll take the most lopsided distribution here and average draws from it - and watch the averages turn into a bell no matter how skewed the source is.",
    note: "That's the Central Limit Theorem, and it's the most-tested idea in quant statistics.",
  },
];

export default function DistributionsIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Read the Shape</h1>
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
            <AccessStartButton gameId="statistics-read-the-shape" title="Read the Shape" defaultLabel="Start" className="hs-chunky-btn" onStart={onDone}>
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
