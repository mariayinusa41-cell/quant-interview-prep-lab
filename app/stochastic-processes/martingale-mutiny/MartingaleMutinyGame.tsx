"use client";

import { useState } from "react";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import { BoatIcon, IslandIcon, ReefIcon } from "./MutinyIcons";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import {
  EQUILIBRIUM_CEILING,
  GAME,
  P_SHOCK,
  blankFormulaAnswer,
  resolveStep,
  scorePrediction,
  theoreticalExpectedValue,
  type StepResult,
} from "./martingaleMath";
import "./mutiny.css";

// The guided fill-in-the-blank option is only offered for the first few
// legs — after that it's just "Sail on" like normal, no standing toggle.
const GUIDED_LEGS = 3;
const BLANK_TOLERANCE = 0.5; // absolute cargo units — see blankFormulaAnswer's rounding-gap note

type Phase = "briefing" | "sailing" | "predicting" | "busted" | "targeted" | "stopped";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Map a cargo level onto the ocean track's 0-100% span, clamped to the visible range.
function trackPosition(x: number): number {
  const span = GAME.TARGET - GAME.BUST_FLOOR;
  return Math.max(0, Math.min(100, ((x - GAME.BUST_FLOOR) / span) * 100));
}

export default function MartingaleMutinyGame() {
  const { recordAttempt } = useProgress();
  const [phase, setPhase] = useState<Phase>("briefing");
  const [x, setX] = useState(GAME.X0);
  const [step, setStep] = useState(0);
  const [shockCount, setShockCount] = useState(0);
  const [justShocked, setJustShocked] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [predictionScore, setPredictionScore] = useState<{ points: number; label: string } | null>(null);

  // Guided fill-in-the-blank state: the outcome is rolled immediately (so
  // the formula and the random draw shown are the REAL ones that will be
  // applied), but not committed to x/step until the player has had a
  // chance to compute it themselves and see how they did.
  const [pendingStep, setPendingStep] = useState<StepResult | null>(null);
  const [blankInput, setBlankInput] = useState("");
  const [blankChecked, setBlankChecked] = useState(false);
  const [blankCorrect, setBlankCorrect] = useState(false);

  function start() {
    setX(GAME.X0);
    setStep(0);
    setShockCount(0);
    setJustShocked(false);
    setPrediction("");
    setPredictionScore(null);
    setPendingStep(null);
    setBlankInput("");
    setBlankChecked(false);
    setPhase("sailing");
  }

  // Applies an already-resolved step's outcome to game state and checks the
  // three ending conditions — shared by the quick path and the guided path
  // so both advance the exact same way.
  function commitStep(result: StepResult, nextStep: number) {
    setX(result.nextX);
    setStep(nextStep);
    setJustShocked(result.shocked);
    if (result.shocked) setShockCount((s) => s + 1);

    if (result.nextX <= GAME.BUST_FLOOR) setPhase("busted");
    else if (result.nextX >= GAME.TARGET) setPhase("targeted");
    else if (nextStep >= GAME.MAX_STEPS) setPhase("stopped");
  }

  function doStep() {
    if (phase !== "sailing") return;
    commitStep(resolveStep(x, step + 1), step + 1);
  }

  function startGuidedStep() {
    if (phase !== "sailing") return;
    setPendingStep(resolveStep(x, step + 1));
    setBlankInput("");
    setBlankChecked(false);
  }

  function checkBlank() {
    if (!pendingStep) return;
    const guess = Number(blankInput);
    if (blankInput.trim() === "" || isNaN(guess)) return;
    const answer = blankFormulaAnswer(x, pendingStep);
    const ok = Math.abs(guess - answer) <= BLANK_TOLERANCE;
    // Graded: evaluating the step formula is a question with a right answer.
    recordAttempt("optional-stopping", ok ? "correct" : "incorrect");
    setBlankCorrect(ok);
    setBlankChecked(true);
  }

  function continueAfterBlank() {
    if (!pendingStep) return;
    commitStep(pendingStep, step + 1);
    setPendingStep(null);
    setBlankInput("");
    setBlankChecked(false);
  }

  function handleBlankKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (blankChecked) continueAfterBlank();
      else checkBlank();
    }
  }

  // Dropping anchor is a deliberate choice, so it's the one moment that asks
  // you to actually use the recursion instead of just watching the boat move.
  function dropAnchor() {
    if (phase !== "sailing") return;
    setPhase("predicting");
  }

  function submitPrediction() {
    const g = Number(prediction);
    if (prediction.trim() === "" || isNaN(g)) return;
    const trueValue = theoreticalExpectedValue(step);
    const score = scorePrediction(g, trueValue);
    // Graded on the estimate only. Busting or reaching the island is the
    // random outcome of the voyage and never touches tickets or accuracy.
    recordAttempt("optional-stopping", score.points >= 2 ? "correct" : "incorrect");
    setPredictionScore(score);
    setPhase("stopped");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitPrediction();
  }

  const resultDone = phase === "busted" || phase === "targeted" || phase === "stopped";
  const theoreticalNow = theoreticalExpectedValue(step);

  if (phase === "briefing") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Game 02</p>
        <h1 className="pirate-story-line answer-title">Martingale Mutiny</h1>
        <div className="pixel-stage stochastic-briefing mutiny-brief-stage">
          <div className="mutiny-brief-icons">
            <BoatIcon className="mutiny-icon-lg" />
            <span className="mutiny-brief-arrow">→</span>
            <IslandIcon className="mutiny-icon-lg" />
          </div>
          <p className="quiz-panel-title">A positive edge. A proportional storm. When do you drop anchor?</p>
          <p>
            Your boat sets out with {GAME.X0} in cargo, aiming for the island. Each leg of the crossing you either
            gain {GAME.MU} on average (rougher water the further you go), or — with a small Poisson-arrival chance —
            a storm hits and halves everything in your hold. Sail on for more expected cargo, or drop anchor and bank
            what you've got.
          </p>
          <div className="stochastic-rule-grid">
            <div><strong>EDGE</strong><span>+{GAME.MU} avg/leg</span><small>growing swell each leg</small></div>
            <div><strong>STORM</strong><span>λ = {GAME.LAMBDA}</span><small>~{pct(P_SHOCK)} chance/leg, halves your hold</small></div>
            <div><strong>ANCHOR</strong><span>bank now</span><small>a valid stopping time — you'll have to predict first</small></div>
          </div>
          <p className="mm-step-hint">
            Interview lens: a flat edge against a proportional loss doesn't compound forever. Before you can drop
            anchor, you'll have to estimate the recursion's expected value yourself — no live readout while you sail.
          </p>
          <AccessStartButton gameId="stochastic-martingale-mutiny" title="Martingale Mutiny" defaultLabel="Set sail" className="continue-btn" onStart={start}>
            Set sail
          </AccessStartButton>
        </div>
      </div>
    );
  }

  if (phase === "predicting") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Dropping anchor</p>
        <h1 className="pirate-story-line answer-title">Before we tally up…</h1>
        <div className="pixel-stage stochastic-briefing">
          <p className="quiz-panel-title">You've taken {step} legs. What's the theoretical expected cargo at this point?</p>
          <p>
            Recall the recursion: E[Xₙ] = a·E[Xₙ₋₁] + b, with a = 1 − p/2 ≈ {(1 - 0.5 * P_SHOCK).toFixed(4)} and b = (1−p)μ ≈{" "}
            {((1 - P_SHOCK) * GAME.MU).toFixed(3)}, starting from E[X₀] = {GAME.X0}. It converges to a fixed point around{" "}
            {EQUILIBRIUM_CEILING.toFixed(0)}.
          </p>
          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your estimate of E[Xₙ] at this step"
              autoComplete="off"
              inputMode="decimal"
            />
            <button type="button" className="calc-submit-btn" onClick={submitPrediction}>Lock in &amp; drop anchor</button>
          </div>
        </div>
      </div>
    );
  }

  if (resultDone) {
    const title = phase === "busted" ? "Shipwrecked" : phase === "targeted" ? "Landed on the island" : "Anchored";
    const banner =
      phase === "busted"
        ? { outcome: "loss" as const, title: "SHIPWRECKED", sub: "A storm (or a run of bad legs) dropped your hold to the shipwreck line. The crew's out." }
        : phase === "targeted"
          ? { outcome: "win" as const, title: "ISLAND REACHED", sub: `You cleared the ${GAME.TARGET}-cargo island — well above the ~${EQUILIBRIUM_CEILING.toFixed(0)} typical crossing.` }
          : {
              outcome: (x >= theoreticalNow ? "win" : "loss") as "win" | "loss",
              title: x >= theoreticalNow ? "BANKED AHEAD OF THEORY" : "BANKED BEHIND THEORY",
              sub: "You chose to drop anchor. Here's how your prediction and your haul compare to the recursion.",
            };

    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Run complete</p>
        <h1 className="pirate-story-line answer-title">{title}</h1>
        <ResultBanner outcome={banner.outcome} title={banner.title} sub={banner.sub} />

        <div className="stochastic-result-grid">
          <div><span>CARGO BANKED</span><strong>{x.toFixed(1)}</strong></div>
          <div><span>LEGS SAILED</span><strong>{step}</strong></div>
          <div><span>STORMS HIT</span><strong>{shockCount}</strong></div>
        </div>

        {predictionScore && (
          <div className={predictionScore.points >= 2 ? "mutiny-verdict is-good" : predictionScore.points >= 1 ? "mutiny-verdict is-ok" : "mutiny-verdict is-miss"}>
            <span>Prediction: {predictionScore.label}</span>
            <span>+{predictionScore.points} pts</span>
          </div>
        )}

        <div className="stochastic-explain">
          <p className="label">What the recursion says</p>
          <p>
            The expected cargo after {step} legs under this process is <strong>{theoreticalNow.toFixed(1)}</strong>.
            {predictionScore && (
              <> You predicted <strong>{Number(prediction).toFixed(1)}</strong> before seeing this. </>
            )}
            You actually banked <strong>{x.toFixed(1)}</strong>, {x >= theoreticalNow ? "above" : "below"} the theoretical value.
          </p>
          <code>E[Xₙ] = a·E[Xₙ₋₁] + b, a = 1 − p/2, b = (1−p)μ</code>
          <p>
            That recursion has a fixed point at <strong>{EQUILIBRIUM_CEILING.toFixed(1)}</strong>: because the storm
            cost scales with your current hold but the edge is flat, expected cargo never climbs past that ceiling no
            matter how long you sail. Beating it means beating the odds, not the strategy.
          </p>
        </div>

        <AccessStartButton gameId="stochastic-martingale-mutiny" title="Martingale Mutiny" defaultLabel="Sail again" className="continue-btn" onStart={start}>
          Sail again
        </AccessStartButton>
      </div>
    );
  }

  // ---------- Sailing ----------
  return (
    <div className="answer-content">
      <p className="pirate-kicker">Stochastic Processes // Live crossing</p>
      <h1 className="pirate-story-line answer-title">Martingale Mutiny</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        Leg {step}/{GAME.MAX_STEPS}. Shipwrecked below {GAME.BUST_FLOOR}, island at {GAME.TARGET}.
      </p>

      <div className="pixel-stage stochastic-stage">
        <div className="stochastic-hud">
          <span>CARGO <strong>{x.toFixed(1)}</strong></span>
          <span>STORMS <strong>{shockCount}</strong></span>
          <span>LEG <strong>{step}/{GAME.MAX_STEPS}</strong></span>
        </div>

        {/* A real sea rather than a progress bar: the boat's horizontal
            position is still trackPosition(x), but it now rides a waterline
            with scrolling wave layers, the reef to port and the island to
            starboard. A storm shakes the whole scene. */}
        <div
          className={justShocked ? "mutiny-ocean is-storming" : "mutiny-ocean"}
          aria-label={`Cargo ${x.toFixed(1)} of island target ${GAME.TARGET}`}
        >
          <div className="mutiny-sky" />

          <ReefIcon className="mutiny-icon-sm mutiny-reef" />
          <IslandIcon className="mutiny-icon-sm mutiny-island" />

          <div className="mutiny-boat-marker" style={{ left: `${trackPosition(x)}%` }}>
            <BoatIcon className="mutiny-icon-sm" />
          </div>

          {/* Two layers at different speeds/opacities so the surface reads
              as moving water instead of a single sliding shape. Each SVG
              holds the wave twice end-to-end and scrolls exactly one copy,
              which makes the loop seamless. */}
          <div className="mutiny-water">
            <svg className="mutiny-wave mutiny-wave-back" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 12 Q 15 4 30 12 T 60 12 T 90 12 T 120 12 T 150 12 T 180 12 T 210 12 T 240 12 V24 H0 Z" />
            </svg>
            <svg className="mutiny-wave mutiny-wave-front" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 14 Q 15 6 30 14 T 60 14 T 90 14 T 120 14 T 150 14 T 180 14 T 210 14 T 240 14 V24 H0 Z" />
            </svg>
            <div className="mutiny-deep" />
          </div>

          {justShocked && <div className="blood-flash mutiny-storm-flash" key={step} />}
        </div>
        <div className="mutiny-checkpoints">
          <span className="mutiny-checkpoint" style={{ left: `${trackPosition(GAME.BUST_FLOOR)}%` }}>{GAME.BUST_FLOOR}</span>
          <span className="mutiny-checkpoint" style={{ left: `${trackPosition(GAME.X0)}%` }}>{GAME.X0}</span>
          <span className="mutiny-checkpoint" style={{ left: `${trackPosition(GAME.TARGET)}%` }}>{GAME.TARGET}</span>
        </div>
        <div className="stochastic-boundaries"><span>SHIPWRECK</span><span>ISLAND</span></div>

        {pendingStep ? (
          <div className="stochastic-explain mutiny-blank-panel">
            <p className="label">Fill in the blank — leg {step + 1}</p>
            {pendingStep.shocked ? (
              <>
                <p>Storm check: a Poisson-arrival event with rate λ = {GAME.LAMBDA} gives ~{pct(P_SHOCK)} chance per leg — it hit this time. Storms take a fixed fraction, regardless of how much cargo you're carrying.</p>
                <p className="mutiny-formula">nextCargo = currentCargo × {GAME.SHOCK_MULTIPLIER}</p>
                <p className="mutiny-formula-filled">
                  nextCargo = {x.toFixed(1)} × {GAME.SHOCK_MULTIPLIER} = <span className="mutiny-blank">?</span>
                </p>
              </>
            ) : (
              <>
                <p>Storm check: ~{pct(P_SHOCK)} chance per leg — didn't hit this time. Calm-water gain is drawn from a Normal distribution with mean +{GAME.MU} and this leg's spread σₙ.</p>
                <p className="mutiny-formula">nextCargo = currentCargo + μ + σₙ · z</p>
                <p className="mutiny-formula-filled">
                  nextCargo = {x.toFixed(1)} + {GAME.MU} + {(Math.round((pendingStep.sigmaUsed ?? 0) * 100) / 100).toFixed(2)} ×{" "}
                  {(Math.round((pendingStep.zUsed ?? 0) * 100) / 100).toFixed(2)} = <span className="mutiny-blank">?</span>
                </p>
              </>
            )}

            {!blankChecked ? (
              <div className="calc-input-row">
                <input
                  type="text"
                  className="calc-input"
                  value={blankInput}
                  onChange={(e) => setBlankInput(e.target.value)}
                  onKeyDown={handleBlankKeyDown}
                  placeholder="Work it out and enter your cargo total"
                  autoComplete="off"
                  inputMode="decimal"
                />
                <button type="button" className="calc-submit-btn" onClick={checkBlank}>Check</button>
              </div>
            ) : (
              <>
                <p className={blankCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                  {blankCorrect ? "Correct. " : "Not quite. "}
                  The formula gives <strong>{blankFormulaAnswer(x, pendingStep).toFixed(1)}</strong>.
                </p>
                <button type="button" className="continue-btn" onClick={continueAfterBlank}>Continue sailing →</button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="stochastic-last-move">
              {justShocked
                ? `Storm hits! Cargo halved to ${x.toFixed(1)}.`
                : step === 0
                  ? "Take the first leg."
                  : `Leg ${step}: calm water, cargo moved to ${x.toFixed(1)}.`}
            </p>

            <div className="stochastic-actions">
              <button type="button" className="continue-btn" onClick={doStep}>Sail on</button>
              {step < GUIDED_LEGS && (
                <button type="button" className="chip-btn" onClick={startGuidedStep}>Walk me through it</button>
              )}
              <button type="button" className="chip-btn" onClick={dropAnchor}>Drop anchor</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
