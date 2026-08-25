"use client";

import { useEffect, useState } from "react";
import { PALETTES, PixelSprite } from "./sprites";
import type { PayoffMatrix, Teaser } from "./teaserTypes";

// Plays any teaser from the bank. Same self-chaining relative-timer pattern
// as PirateStory: each beat schedules only its own successor, so Skip (an
// out-of-band setBeat) cancels the pending timer through effect cleanup and
// nothing desyncs.

type Stage = "story" | "assumptions" | "question" | "answer" | "breakdown";

function MatrixView({ matrix }: { matrix: PayoffMatrix }) {
  return (
    <div className="story-matrix-wrap">
      <p className="story-matrix-col-player">{matrix.colPlayer} chooses ↓</p>
      <table className="story-matrix">
        <thead>
          <tr>
            <th className="story-matrix-corner" />
            {matrix.colChoices.map((c) => (
              <th key={c} className="story-matrix-head">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rowChoices.map((r, ri) => (
            <tr key={r}>
              <th className="story-matrix-head is-row">{r}</th>
              {matrix.colChoices.map((c, ci) => {
                const isHot = matrix.highlight && matrix.highlight[0] === ri && matrix.highlight[1] === ci;
                return (
                  <td key={c} className={isHot ? "story-matrix-cell is-hot" : "story-matrix-cell"}>
                    {matrix.cells[ri][ci]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="story-matrix-row-player">{matrix.rowPlayer} chooses →</p>
      {matrix.caption && <p className="story-matrix-caption">{matrix.caption}</p>}
    </div>
  );
}

export default function StoryTeaser({ teaser }: { teaser: Teaser }) {
  const [stage, setStage] = useState<Stage>("story");
  const [beat, setBeat] = useState(0);
  const [assumptionStep, setAssumptionStep] = useState(0);
  const [guess, setGuess] = useState("");
  const [answerStep, setAnswerStep] = useState(0);

  const beats = teaser.beats;
  const current = beats[Math.min(beat, beats.length - 1)];

  // Story auto-advance.
  useEffect(() => {
    if (stage !== "story") return;
    if (beat >= beats.length - 1) {
      const t = window.setTimeout(() => setStage("assumptions"), beats[beats.length - 1].hold);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setBeat((b) => b + 1), beats[beat].hold);
    return () => window.clearTimeout(t);
  }, [stage, beat, beats]);

  // Assumptions reveal one at a time, then the question.
  useEffect(() => {
    if (stage !== "assumptions") return;
    if (assumptionStep >= teaser.assumptions.length) {
      const t = window.setTimeout(() => setStage("question"), 900);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setAssumptionStep((s) => s + 1), 2200);
    return () => window.clearTimeout(t);
  }, [stage, assumptionStep, teaser.assumptions.length]);

  const skip = () => {
    setStage("question");
    setBeat(beats.length - 1);
    setAssumptionStep(teaser.assumptions.length);
  };

  // Cast visibility carries forward from the most recent beat that set it, so
  // a beat only has to declare the cast when it actually changes.
  const visible = (() => {
    for (let i = Math.min(beat, beats.length - 1); i >= 0; i--) {
      if (beats[i].show) return beats[i].show!;
    }
    return teaser.cast.map((c) => c.id);
  })();
  const dim = current?.dim ?? [];
  const lit = current?.lit ?? [];

  const showStage = stage === "story" || stage === "assumptions";

  return (
    <div className="pirate-stage-content">
      {stage !== "answer" && stage !== "breakdown" && stage !== "question" && (
        <button type="button" className="skip-btn" onClick={skip}>
          Skip
        </button>
      )}

      <p className="pirate-kicker">Brain Teasers</p>
      <h1 className="pirate-story-line answer-title">{teaser.title}</h1>

      {showStage && (
        <>
          <div className="story-stage">
            {teaser.cast
              .filter((c) => visible.includes(c.id))
              .map((c) => (
                <div className="story-actor" key={c.id}>
                  <PixelSprite
                    sprite={c.sprite}
                    palette={PALETTES[c.palette] ?? PALETTES.blue}
                    dimmed={dim.includes(c.id)}
                    lit={lit.includes(c.id)}
                  />
                  {c.label && <span className="story-actor-label">{c.label}</span>}
                </div>
              ))}
          </div>

          {current?.matrix && <MatrixView matrix={current.matrix} />}
        </>
      )}

      {stage === "story" && (
        <div className="story-caption-slot">
          {current?.caption && (
            <p key={beat} className="pirate-story-line pirate-enter story-caption">
              {current.caption}
            </p>
          )}
          {current?.note && <p className="story-note pirate-enter">{current.note}</p>}
        </div>
      )}

      {stage === "assumptions" && (
        <div className="story-caption-slot">
          {teaser.assumptions.slice(0, assumptionStep + 1).map((a, i) => (
            <p key={i} className="pirate-story-line pirate-enter story-assumption">
              {a}
            </p>
          ))}
        </div>
      )}

      {stage === "question" && (
        <div className="story-question-block pirate-enter">
          <p className="vote-caption final-question">{teaser.question}</p>
          <p className="story-note">Commit to an answer before you open the solution - that's the whole point.</p>
          <div className="quiz-q-input-row" style={{ justifyContent: "center" }}>
            <input
              type="text"
              className="quiz-q-input"
              placeholder={teaser.guessPlaceholder}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
            />
          </div>
          <button type="button" className="continue-btn" onClick={() => setStage("answer")}>
            {guess.trim() ? "Lock it in - show the answer" : "Show the answer"}
          </button>
        </div>
      )}

      {stage === "answer" && (
        <div className="story-answer-block pirate-enter">
          {guess.trim() && (
            <p className="story-note">
              You said: <strong>{guess}</strong>
            </p>
          )}
          <p className="vote-caption final-question">{teaser.answerHeadline}</p>

          <div className="story-steps">
            {teaser.answerSteps.slice(0, answerStep + 1).map((s, i) => (
              <div className="story-step pirate-enter" key={i}>
                <p className="story-step-label">{s.label}</p>
                <p className="story-step-text">{s.text}</p>
              </div>
            ))}
          </div>

          {answerStep < teaser.answerSteps.length - 1 ? (
            <button type="button" className="continue-btn" onClick={() => setAnswerStep((s) => s + 1)}>
              Next step
            </button>
          ) : (
            <button type="button" className="continue-btn" onClick={() => setStage("breakdown")}>
              Why it works
            </button>
          )}
        </div>
      )}

      {stage === "breakdown" && (
        <div className="story-answer-block pirate-enter">
          <p className="vote-caption final-question">Why it works</p>
          {teaser.breakdown.map((b) => (
            <div className="story-breakdown" key={b.heading}>
              <p className="story-step-label">{b.heading}</p>
              <p className="story-step-text">{b.body}</p>
            </div>
          ))}
          <a href="/brain-teasers" className="continue-btn" style={{ display: "inline-block", textDecoration: "none" }}>
            Back to teasers
          </a>
        </div>
      )}
    </div>
  );
}
