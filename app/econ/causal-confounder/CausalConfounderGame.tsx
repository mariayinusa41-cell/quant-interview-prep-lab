"use client";

import { useState } from "react";
import TeX from "../../math/TeX";
import { adjustedDid, did, groupChange, preTrendGap, type Cell, type Confounder } from "../causalMath";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

// Monthly units sold, in thousands. Northgate is the plaintiff's region,
// where the defendant's pricing policy took effect. Southvale is untouched
// and serves as the counterfactual.
const TREATED: Cell = { pre: 520, post: 400 };
const CONTROL: Cell = { pre: 500, post: 460 };

// Pre-period months, used for the parallel-trends check.
const TREATED_PRE = [508, 514, 520];
const CONTROL_PRE = [488, 494, 500];

// The warehouse fire is the only treated-only, post-period shock.
const TRUE_SHOCK = -30;

const CONFOUNDERS: Confounder[] = [
  {
    id: "fuel",
    label: "National fuel surcharge",
    detail: "A carrier-wide delivery surcharge raised costs in every region, including Southvale, from month 1 of the post period.",
    biases: false,
    why: "It hits both groups, so it lands in the control difference too and cancels in the subtraction.",
  },
  {
    id: "fire",
    label: "Northgate warehouse fire",
    detail: "A fire took Northgate's main distribution centre offline for six weeks in the post period. Southvale was unaffected.",
    biases: true,
    why: "Treated group only, inside the post window - nothing in the control difference offsets it, so it is absorbed into the estimate as if the defendant caused it.",
  },
  {
    id: "baseline",
    label: "Northgate always sold more",
    detail: "Northgate has run roughly 20k units a month above Southvale for years, well before the policy.",
    biases: false,
    why: "A fixed level gap sits in both the pre and post figures for that group, so it cancels in the first difference. DiD never required the groups to be identical, only to move in parallel.",
  },
];

const DID_TOLERANCE = 3;
type Phase = "brief" | "naive" | "confounder" | "adjusted" | "done";

export default function CausalConfounderGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [phase, setPhase] = useState<Phase>("brief");
  const [naiveInput, setNaiveInput] = useState("");
  const [naiveChecked, setNaiveChecked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [pickChecked, setPickChecked] = useState(false);
  const [adjInput, setAdjInput] = useState("");
  const [adjChecked, setAdjChecked] = useState(false);
  const [score, setScore] = useState(0);

  const naiveTruth = did(TREATED, CONTROL);
  const adjustedTruth = adjustedDid(TREATED, CONTROL, TRUE_SHOCK);
  const trendGap = preTrendGap(TREATED_PRE, CONTROL_PRE);

  const start = () => {
    setPhase("naive");
    startMusic("game");
  };

  function checkNaive() {
    if (naiveChecked) return;
    const g = Number(naiveInput);
    const ok = naiveInput.trim() !== "" && Math.abs(g - naiveTruth) <= DID_TOLERANCE;
    recordAttempt("regression", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    setNaiveChecked(true);
  }

  function checkPick() {
    if (pickChecked || picked === null) return;
    const chosen = CONFOUNDERS.find((c) => c.id === picked);
    const ok = chosen?.biases === true;
    recordAttempt("selection-bias", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setPickChecked(true);
  }

  function checkAdjusted() {
    if (adjChecked) return;
    const g = Number(adjInput);
    const ok = adjInput.trim() !== "" && Math.abs(g - adjustedTruth) <= DID_TOLERANCE;
    recordAttempt("regression", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setAdjChecked(true);
  }

  if (phase === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">You are the testifying economist. The other side has one too.</p>
          <p>
            Northgate Retail is suing over a pricing policy it says destroyed its sales. Sales did
            fall. The entire case is whether <em>the policy</em> caused the fall - and how much of it.
          </p>
          <div className="lab-topic-grid">
            {[
              ["DiD", "difference the differences"],
              ["PARALLEL TRENDS", "the assumption that can break"],
              ["CONFOUNDERS", "what else moved"],
              ["DAMAGES", "the number you defend"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Interview lens: consulting cases are won on the alternative explanation you find before
            opposing counsel does. Anyone can subtract two numbers.
          </p>
          <AccessStartButton
            gameId="econ-causal-confounder"
            title="The Causal Confounder"
            defaultLabel="Open the file"
            className="continue-btn"
            onStart={start}
          >
            Open the case file
          </AccessStartButton>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>PHASE <strong>{phase === "naive" ? "1/3" : phase === "confounder" ? "2/3" : "3/3"}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
      </div>

      {/* ---------- 2x2 panel ---------- */}
      <div className="did-grid">
        <div className="did-cell is-head" />
        <div className="did-cell is-head">Before policy</div>
        <div className="did-cell is-head">After policy</div>
        <div className="did-cell is-head">Change</div>

        <div className="did-cell is-label">Northgate <em>(treated)</em></div>
        <div className="did-cell">{TREATED.pre}</div>
        <div className="did-cell">{TREATED.post}</div>
        <div className="did-cell is-delta">{groupChange(TREATED)}</div>

        <div className="did-cell is-label">Southvale <em>(control)</em></div>
        <div className="did-cell">{CONTROL.pre}</div>
        <div className="did-cell">{CONTROL.post}</div>
        <div className="did-cell is-delta">{groupChange(CONTROL)}</div>
      </div>
      <p className="tri-note">Average monthly units sold, thousands.</p>

      {/* ---------- Parallel trends evidence ---------- */}
      <div className="did-trends">
        <p className="did-trends-title">Pre-period months (parallel trends check)</p>
        <div className="did-trend-row">
          <span>Northgate</span>
          {TREATED_PRE.map((v, i) => <em key={i}>{v}</em>)}
          <strong>+{((TREATED_PRE[2] - TREATED_PRE[0]) / 2).toFixed(0)}/mo</strong>
        </div>
        <div className="did-trend-row">
          <span>Southvale</span>
          {CONTROL_PRE.map((v, i) => <em key={i}>{v}</em>)}
          <strong>+{((CONTROL_PRE[2] - CONTROL_PRE[0]) / 2).toFixed(0)}/mo</strong>
        </div>
        <p className="tri-note">
          Pre-trend gap: {trendGap.toFixed(1)} per month. They were moving together before the
          policy, so the design is admissible - the levels differ, but the <em>trends</em> match.
        </p>
      </div>

      {/* ---------- Phase 1 ---------- */}
      {phase === "naive" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 1 - the naive estimate</p>
          <p className="mm-step-hint">
            Southvale tells you what Northgate would have done anyway. Subtract it out.
          </p>
          <TeX block>{String.raw`\text{DiD} = (T_{post} - T_{pre}) - (C_{post} - C_{pre})`}</TeX>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={naiveInput}
              disabled={naiveChecked}
              placeholder="Estimated effect (thousands of units)"
              onChange={(e) => setNaiveInput(e.target.value)}
            />
            {!naiveChecked && <button type="button" className="calc-submit-btn" onClick={checkNaive}>Check</button>}
          </div>

          {naiveChecked && (
            <>
              <p className={Math.abs(Number(naiveInput) - naiveTruth) <= DID_TOLERANCE ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                DiD = ({TREATED.post} − {TREATED.pre}) − ({CONTROL.post} − {CONTROL.pre}) ={" "}
                {groupChange(TREATED)} − ({groupChange(CONTROL)}) = <strong>{naiveTruth}</strong>.
                Northgate fell {Math.abs(groupChange(TREATED))}, but {Math.abs(groupChange(CONTROL))} of
                that was happening everywhere.
              </p>
              <p className="quiz-q-explain">
                This is the plaintiff&rsquo;s number. Before you sign it, ask what else hit Northgate
                and not Southvale.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("confounder")}>
                Review the alternative explanations →
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------- Phase 2 ---------- */}
      {phase === "confounder" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 2 - which one actually biases the estimate?</p>
          <p className="mm-step-hint">
            Discovery turns up three facts. Only one of them contaminates a DiD. Pick it.
          </p>

          <div className="conf-list">
            {CONFOUNDERS.map((c) => (
              <button
                type="button"
                key={c.id}
                disabled={pickChecked}
                className={
                  pickChecked
                    ? c.biases
                      ? "conf-card is-answer"
                      : picked === c.id
                        ? "conf-card is-wrong"
                        : "conf-card"
                    : picked === c.id
                      ? "conf-card is-on"
                      : "conf-card"
                }
                onClick={() => setPicked(c.id)}
              >
                <strong>{c.label}</strong>
                <span>{c.detail}</span>
                {pickChecked && <em>{c.biases ? "BIASES THE ESTIMATE - " : "Cancels out - "}{c.why}</em>}
              </button>
            ))}
          </div>

          {!pickChecked ? (
            <button type="button" className="calc-submit-btn" disabled={picked === null} onClick={checkPick}>
              Lock in
            </button>
          ) : (
            <button type="button" className="continue-btn" onClick={() => setPhase("adjusted")}>
              Re-estimate the damages →
            </button>
          )}
        </div>
      )}

      {/* ---------- Phase 3 ---------- */}
      {phase === "adjusted" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 3 - the number you would defend</p>
          <p className="mm-step-hint">
            Northgate&rsquo;s own logistics filings put the fire&rsquo;s impact at{" "}
            <strong>{Math.abs(TRUE_SHOCK)}k units</strong> over the post period. Strip it out of the
            naive estimate of {naiveTruth}.
          </p>
          <TeX block>{String.raw`\text{Causal effect} = \text{DiD} - \text{treated-only shock}`}</TeX>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={adjInput}
              disabled={adjChecked}
              placeholder="Adjusted causal effect"
              onChange={(e) => setAdjInput(e.target.value)}
            />
            {!adjChecked && <button type="button" className="calc-submit-btn" onClick={checkAdjusted}>Check</button>}
          </div>

          {adjChecked && (
            <>
              <p className={Math.abs(Number(adjInput) - adjustedTruth) <= DID_TOLERANCE ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                {naiveTruth} − ({TRUE_SHOCK}) = <strong>{adjustedTruth}</strong>. The defensible
                damages figure is {Math.abs(adjustedTruth)}k units, not {Math.abs(naiveTruth)}k -
                the naive estimate overstated the claim by{" "}
                {Math.round((Math.abs(naiveTruth) / Math.abs(adjustedTruth) - 1) * 100)}%.
              </p>
              <p className="quiz-q-explain">
                Worth stating plainly in a viva: DiD already removes anything common to both markets
                and any permanent level gap between them. The only thing it cannot absorb is a shock
                that lands on the treated group alone inside the post window - which is precisely
                what you were hired to find.
              </p>
              <AccessStartButton
                gameId="econ-causal-confounder"
                title="The Causal Confounder"
                defaultLabel="New case"
                className="continue-btn"
                onStart={() => {
                  setPhase("naive");
                  setNaiveInput(""); setNaiveChecked(false);
                  setPicked(null); setPickChecked(false);
                  setAdjInput(""); setAdjChecked(false);
                }}
              >
                Take another case
              </AccessStartButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
