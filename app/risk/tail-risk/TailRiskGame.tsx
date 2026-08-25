"use client";

import { useState } from "react";
import TeX from "../../math/TeX";
import {
  normalES,
  normalVaR,
  portfolioVol,
  uniformCorr,
  type Asset,
} from "../tailRiskMath";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

const NAV = 100; // $M

const ASSETS: Asset[] = [
  { id: "eq", name: "Equity index", weight: 0.5, vol: 0.012 },
  { id: "hy", name: "High-yield credit", weight: 0.3, vol: 0.008 },
  { id: "opt", name: "Exotic derivatives", weight: 0.2, vol: 0.025 },
];

// Correlations estimated from a calm sample — which is exactly the sample
// that will not describe the next crisis.
const CALM_CORR = [
  [1, 0.35, 0.55],
  [0.35, 1, 0.2],
  [0.55, 0.2, 1],
];

const CONF = 0.99;
// t(4) with the same variance: measured by simulation, ES runs ~40% above
// the normal figure at the 99% level.
const FAT_TAIL_ES_MULTIPLE = 1.4;

const VOL_TOL = 0.0006; // 0.06pp
const MONEY_TOL = 0.25; // $M

type Phase = "brief" | "calm" | "crisis" | "shortfall" | "hedge";

const HEDGES = [
  {
    id: "puts",
    label: "Buy deep out-of-the-money index puts",
    correct: true,
    why: "The only option that pays off specifically in the tail. It converts an unbounded left tail into a known premium - you are buying the part of the distribution that is hurting you.",
  },
  {
    id: "diversify",
    label: "Diversify further across more asset classes",
    correct: false,
    why: "Diversification is precisely what just failed. When correlations converge to 1, adding more correlated assets adds exposure, not protection.",
  },
  {
    id: "var-limit",
    label: "Keep the position, VaR is still inside the limit",
    correct: false,
    why: "VaR says nothing about the size of the loss once the threshold is breached. Managing to a number that is silent about the tail is how firms discover the tail.",
  },
  {
    id: "double",
    label: "Add to the position - the selloff is an opportunity",
    correct: false,
    why: "Averaging into a liquidity vacuum with a margin call pending is how a drawdown becomes a liquidation.",
  },
];

export default function TailRiskGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [phase, setPhase] = useState<Phase>("brief");
  const [calmInput, setCalmInput] = useState("");
  const [calmChecked, setCalmChecked] = useState(false);
  const [crisisInput, setCrisisInput] = useState("");
  const [crisisChecked, setCrisisChecked] = useState(false);
  const [esInput, setEsInput] = useState("");
  const [esChecked, setEsChecked] = useState(false);
  const [hedgePick, setHedgePick] = useState<string | null>(null);
  const [hedgeChecked, setHedgeChecked] = useState(false);
  const [score, setScore] = useState(0);

  const calmVol = portfolioVol(ASSETS, CALM_CORR);
  const crisisVol = portfolioVol(ASSETS, uniformCorr(ASSETS.length, 1));
  const weightedSum = ASSETS.reduce((a, x) => a + x.weight * x.vol, 0);

  const calmVaR = normalVaR(calmVol, CONF);
  const crisisVaR = normalVaR(crisisVol, CONF);
  const crisisES = normalES(crisisVol, CONF);
  const fatES = crisisES * FAT_TAIL_ES_MULTIPLE;

  const start = () => { setPhase("calm"); startMusic("game"); };

  const pct = (x: number) => (x * 100).toFixed(2);
  const usd = (x: number) => (x * NAV).toFixed(2);

  function checkCalm() {
    if (calmChecked) return;
    const ok = calmInput.trim() !== "" && Math.abs(Number(calmInput) / 100 - calmVol) <= VOL_TOL;
    recordAttempt("distributions", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    setCalmChecked(true);
  }

  function checkCrisis() {
    if (crisisChecked) return;
    const ok = crisisInput.trim() !== "" && Math.abs(Number(crisisInput) / 100 - crisisVol) <= VOL_TOL;
    recordAttempt("distributions", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setCrisisChecked(true);
  }

  function checkEs() {
    if (esChecked) return;
    const ok = esInput.trim() !== "" && Math.abs(Number(esInput) - crisisES * NAV) <= MONEY_TOL;
    recordAttempt("expected-value", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setEsChecked(true);
  }

  function checkHedge() {
    if (hedgeChecked || hedgePick === null) return;
    const ok = HEDGES.find((h) => h.id === hedgePick)?.correct === true;
    recordAttempt("optional-stopping", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    setHedgeChecked(true);
  }

  if (phase === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">You are not paid to forecast the mean. You are paid to survive the tail.</p>
          <p>
            A ${NAV}M book across equities, high-yield credit and exotics. The risk model was fit on
            a calm sample. In a moment it will stop describing the world.
          </p>
          <div className="lab-topic-grid">
            {[
              ["VaR", "the threshold"],
              ["EXPECTED SHORTFALL", "the loss beyond it"],
              ["CORRELATION", "goes to 1 when it matters"],
              ["FAT TAILS", "normal is optimistic"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Interview lens: &ldquo;what is wrong with VaR?&rdquo; is asked in every risk interview.
            The answer is not that it is inaccurate - it is that it is silent past its own threshold.
          </p>
          <AccessStartButton
            gameId="risk-tail-stress"
            title="Tail Risk Stress Tester"
            defaultLabel="Open the book"
            className="continue-btn"
            onStart={start}
          >
            Open the book
          </AccessStartButton>
        </div>
      </div>
    );
  }

  const inCrisis = phase !== "calm";

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>PHASE <strong>{phase === "calm" ? "1/4" : phase === "crisis" ? "2/4" : phase === "shortfall" ? "3/4" : "4/4"}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span className={inCrisis ? "risk-regime is-crisis" : "risk-regime"}>
          {inCrisis ? "REGIME: STRESS" : "REGIME: CALM"}
        </span>
      </div>

      <div className="risk-book">
        <p className="did-trends-title">Portfolio - ${NAV}M</p>
        {ASSETS.map((a) => (
          <div className="risk-asset" key={a.id}>
            <span>{a.name}</span>
            <b>{(a.weight * 100).toFixed(0)}%</b>
            <em>daily σ {(a.vol * 100).toFixed(1)}%</em>
          </div>
        ))}
      </div>

      <div className="risk-corr">
        <p className="did-trends-title">Correlation matrix {inCrisis && <span className="risk-flash">- BREAKING DOWN</span>}</p>
        <table className="tri-table">
          <thead>
            <tr><th /><th>Eq</th><th>HY</th><th>Deriv</th></tr>
          </thead>
          <tbody>
            {ASSETS.map((a, i) => (
              <tr key={a.id}>
                <th scope="row">{["Eq", "HY", "Deriv"][i]}</th>
                {ASSETS.map((_, j) => {
                  const v = inCrisis ? (i === j ? 1 : 1) : CALM_CORR[i][j];
                  return (
                    <td key={j} className={inCrisis && i !== j ? "tri-known risk-hot" : "tri-known"}>
                      {v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phase 1 */}
      {phase === "calm" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 1 - portfolio volatility, calm regime</p>
          <TeX block>{String.raw`\sigma_{p} = \sqrt{\sum_{i}\sum_{j} w_{i} w_{j} \sigma_{i} \sigma_{j} \rho_{ij}}`}</TeX>
          <div className="calc-input-row">
            <input type="text" className="calc-input" inputMode="decimal" value={calmInput}
              disabled={calmChecked} placeholder="Daily σ, in % (e.g. 1.23)"
              onChange={(e) => setCalmInput(e.target.value)} />
            {!calmChecked && <button type="button" className="calc-submit-btn" onClick={checkCalm}>Check</button>}
          </div>
          {calmChecked && (
            <>
              <p className={Math.abs(Number(calmInput) / 100 - calmVol) <= VOL_TOL ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                σ<sub>p</sub> = <strong>{pct(calmVol)}%</strong> daily. That is comfortably below the
                weighted sum of the individual vols ({pct(weightedSum)}%) - the gap is your
                diversification benefit.
              </p>
              <p className="quiz-q-explain">
                99% VaR = z<sub>0.99</sub> × σ = 2.3263 × {pct(calmVol)}% ={" "}
                <strong>{pct(calmVaR)}%</strong>, about <strong>${usd(calmVaR)}M</strong>. Limit is
                $3.00M, so you are inside it.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("crisis")}>
                Continue →
              </button>
            </>
          )}
        </div>
      )}

      {/* Phase 2 */}
      {phase === "crisis" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 2 - the correlations converge</p>
          <p className="mm-step-hint">
            A liquidity vacuum. Everyone is selling everything at once, and every pairwise
            correlation goes to <strong>1.00</strong>. The individual volatilities have not changed
            at all - only the relationships between them.
          </p>
          <div className="calc-input-row">
            <input type="text" className="calc-input" inputMode="decimal" value={crisisInput}
              disabled={crisisChecked} placeholder="New daily σ, in %"
              onChange={(e) => setCrisisInput(e.target.value)} />
            {!crisisChecked && <button type="button" className="calc-submit-btn" onClick={checkCrisis}>Check</button>}
          </div>
          {crisisChecked && (
            <>
              <p className={Math.abs(Number(crisisInput) / 100 - crisisVol) <= VOL_TOL ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                σ<sub>p</sub> = <strong>{pct(crisisVol)}%</strong> - a{" "}
                {((crisisVol / calmVol - 1) * 100).toFixed(0)}% jump with no change in any asset&rsquo;s
                own volatility.
              </p>
              <p className="quiz-q-explain">
                Worth knowing cold: at ρ = 1 the cross terms are maximal and σ<sub>p</sub> collapses
                to the plain weighted sum, Σ wᵢσᵢ = {pct(weightedSum)}%. Diversification has stopped
                existing. VaR is now <strong>${usd(crisisVaR)}M</strong> - through the $3.00M limit.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("shortfall")}>
                But how bad is the breach? →
              </button>
            </>
          )}
        </div>
      )}

      {/* Phase 3 */}
      {phase === "shortfall" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 3 - the number VaR refuses to tell you</p>
          <p className="mm-step-hint">
            VaR says a 1-in-100 day loses at least ${usd(crisisVaR)}M. It says nothing about how much
            worse than that it gets. Expected Shortfall answers exactly that: the average loss{" "}
            <em>given</em> you are already past VaR.
          </p>
          <TeX block>{String.raw`ES_{\alpha} = \frac{\sigma \cdot \phi(z_{\alpha})}{1 - \alpha}`}</TeX>
          <div className="calc-input-row">
            <input type="text" className="calc-input" inputMode="decimal" value={esInput}
              disabled={esChecked} placeholder="99% Expected Shortfall, $M"
              onChange={(e) => setEsInput(e.target.value)} />
            {!esChecked && <button type="button" className="calc-submit-btn" onClick={checkEs}>Check</button>}
          </div>
          {esChecked && (
            <>
              <p className={Math.abs(Number(esInput) - crisisES * NAV) <= MONEY_TOL ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                ES = {pct(crisisVol)}% × 0.02665 ÷ 0.01 = <strong>{pct(crisisES)}%</strong> ={" "}
                <strong>${usd(crisisES)}M</strong> - {(((crisisES / crisisVaR) - 1) * 100).toFixed(0)}%
                worse than the VaR figure you were reporting.
              </p>
              <p className="quiz-q-explain">
                ES is never below VaR, and unlike VaR it is subadditive: combining two books can
                never make ES look better than the sum of the parts. VaR can, which means a firm
                can hide risk by splitting a book across desks. That property is why the Basel
                framework moved to a 97.5% ES.
              </p>
              <button type="button" className="continue-btn" onClick={() => setPhase("hedge")}>
                And the model is still optimistic →
              </button>
            </>
          )}
        </div>
      )}

      {/* Phase 4 */}
      {phase === "hedge" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Step 4 - the normal assumption is the last problem</p>
          <p className="mm-step-hint">
            Everything so far assumed normal returns. Refit the same variance to a Student-t with 4
            degrees of freedom - identical σ, fatter tails - and 99% ES rises from{" "}
            <strong>${usd(crisisES)}M</strong> to about <strong>${usd(fatES)}M</strong>. Same
            volatility, ~40% more loss in the tail, purely from the shape of the distribution.
          </p>

          <div className="risk-tail-compare">
            <div><span>Normal ES</span><strong>${usd(crisisES)}M</strong></div>
            <div className="is-fat"><span>Fat-tailed ES</span><strong>${usd(fatES)}M</strong></div>
          </div>

          <p className="mm-step-hint">What do you do about it?</p>
          <div className="conf-list">
            {HEDGES.map((h) => (
              <button
                type="button"
                key={h.id}
                disabled={hedgeChecked}
                className={
                  hedgeChecked
                    ? h.correct ? "conf-card is-answer" : hedgePick === h.id ? "conf-card is-wrong" : "conf-card"
                    : hedgePick === h.id ? "conf-card is-on" : "conf-card"
                }
                onClick={() => setHedgePick(h.id)}
              >
                <strong>{h.label}</strong>
                {hedgeChecked && <em>{h.why}</em>}
              </button>
            ))}
          </div>

          {!hedgeChecked ? (
            <button type="button" className="calc-submit-btn" disabled={hedgePick === null} onClick={checkHedge}>
              Commit
            </button>
          ) : (
            <>
              <p className="quiz-q-explain">
                The through-line: your loss got worse three separate times without a single asset
                becoming more volatile - once from correlations converging, once from measuring the
                tail instead of its edge, and once from admitting returns are not normal. All three
                are model risk, not market risk.
              </p>
              <AccessStartButton
                gameId="risk-tail-stress"
                title="Tail Risk Stress Tester"
                defaultLabel="Run again"
                className="continue-btn"
                onStart={() => {
                  setPhase("calm");
                  setCalmInput(""); setCalmChecked(false);
                  setCrisisInput(""); setCrisisChecked(false);
                  setEsInput(""); setEsChecked(false);
                  setHedgePick(null); setHedgeChecked(false);
                }}
              >
                Run another stress test
              </AccessStartButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
