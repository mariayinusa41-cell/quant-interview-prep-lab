"use client";

import { useEffect, useRef, useState } from "react";
import {
  PREDICTORS,
  RULE_LABEL,
  RULE_ORDER,
  auxRegress,
  bonferroniThreshold,
  generateSession,
  multiRegress,
  randomSeed,
  regress,
  ruleForPrediction,
  type BotRule,
  type MultiRegressionResult,
  type Observation,
  type RegressionResult,
} from "./botMath";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import CrackTheBotIntro from "./CrackTheBotIntro";

// Five cases, escalating. The last one has NO rule — calling that correctly is
// the hardest and most valuable skill in the game, so it scores like a win.
const CASES: { rule: BotRule; fireRate: number; brief: string }[] = [
  { rule: "momentum", fireRate: 1.0, brief: "Fresh bot on the book. Clean behaviour, no noise." },
  { rule: "reversion", fireRate: 0.9, brief: "Similar setup, different desk. Mostly consistent." },
  { rule: "lag3", fireRate: 0.85, brief: "This one's slower to react than it looks." },
  { rule: "trend", fireRate: 0.75, brief: "Noisier. It ignores its own rule a quarter of the time." },
  { rule: "random", fireRate: 0.0, brief: "New counterparty, no history. Be careful what you conclude." },
];

const START_TICKS = 12; // ticks visible for free at the start of a case
const TICK_COST_MS = 4000; // every extra tick you pull costs clock
const CASE_MS = 120000; // two minutes per case
const PREDICTIONS = 3; // moves you must call after locking in

type Phase = "intro" | "briefing" | "observing" | "predicting" | "caseResult" | "final";

function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function CrackTheBotGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [caseIndex, setCaseIndex] = useState(0);
  const [seed, setSeed] = useState(0);
  const [session, setSession] = useState<Observation[]>([]);
  const [visible, setVisible] = useState(START_TICKS);
  const [tested, setTested] = useState<Record<string, RegressionResult>>({});
  const [confoundX, setConfoundX] = useState<string | null>(null);
  const [confoundZ, setConfoundZ] = useState<string | null>(null);
  const [confoundChoice, setConfoundChoice] = useState<string | null>(null);
  const [confoundChecked, setConfoundChecked] = useState(false);
  const [guess, setGuess] = useState<BotRule | null>(null);
  const [predictions, setPredictions] = useState<(-1 | 1)[]>([]);
  const [clock, setClock] = useState(CASE_MS);
  const [caseScore, setCaseScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [caseNote, setCaseNote] = useState("");

  const deadline = useRef(0);
  const spec = CASES[caseIndex];

  // Case clock. Pulling extra ticks pushes the deadline closer, so the
  // data-vs-time tradeoff is real rather than cosmetic.
  useEffect(() => {
    if (phase !== "observing" && phase !== "predicting") return;
    const t = window.setInterval(() => {
      const left = deadline.current - Date.now();
      setClock(left);
      if (left <= 0) {
        window.clearInterval(t);
        finishCase(false, "Out of time — the case closed before you called it.");
      }
    }, 100);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, caseIndex]);

  const startCase = (i: number) => {
    const s = randomSeed();
    setSeed(s);
    setCaseIndex(i);
    setSession(generateSession(CASES[i].rule, s, 200, CASES[i].fireRate));
    setVisible(START_TICKS);
    setTested({});
    setConfoundX(null);
    setConfoundZ(null);
    setConfoundChoice(null);
    setConfoundChecked(false);
    setGuess(null);
    setPredictions([]);
    setCaseNote("");
    setCaseScore(0);
    deadline.current = Date.now() + CASE_MS;
    setClock(CASE_MS);
    setPhase("briefing");
  };

  const pullTicks = (n: number) => {
    setVisible((v) => Math.min(session.length - PREDICTIONS - 1, v + n));
    deadline.current -= TICK_COST_MS * (n / 5);
    setTested({}); // new data invalidates the old regressions — rerun them
    setConfoundX(null);
    setConfoundZ(null);
    setConfoundChoice(null);
    setConfoundChecked(false);
  };

  const runTest = (id: string) => {
    const obs = session.slice(0, visible);
    setTested((t) => ({ ...t, [id]: regress(obs, id) }));
  };

  const lockIn = (rule: BotRule) => {
    setGuess(rule);
    if (rule === "random") {
      // Nothing to predict if you claim there's no rule — the call itself is
      // the whole answer.
      finishCase(spec.rule === "random", spec.rule === "random"
        ? "Correct — there was no rule. Refusing to trade a false signal is the win."
        : `Wrong — it was following a rule: ${RULE_LABEL[spec.rule]}.`);
      return;
    }
    setPredictions([]);
    setPhase("predicting");
  };

  const makePrediction = (dir: -1 | 1) => {
    const next = [...predictions, dir];
    setPredictions(next);
    if (next.length >= PREDICTIONS) {
      // Score the calls against what the bot actually does next.
      let hits = 0;
      for (let k = 0; k < PREDICTIONS; k++) {
        const truth = session[visible + k].action;
        if (truth === next[k]) hits += 1;
      }
      const ruleRight = guess === spec.rule;
      finishCase(
        ruleRight,
        ruleRight
          ? `Correct rule — ${RULE_LABEL[spec.rule]}. You called ${hits}/${PREDICTIONS} of its next moves.`
          : `Wrong — it was actually ${RULE_LABEL[spec.rule]}. You called ${hits}/${PREDICTIONS} moves.`,
        hits
      );
    }
  };

  const finishCase = (correct: boolean, note: string, hits = 0) => {
    const timeLeft = Math.max(0, deadline.current - Date.now());
    const speedBonus = correct ? Math.round((timeLeft / CASE_MS) * 50) : 0;
    const dataBonus = correct ? Math.max(0, 40 - (visible - START_TICKS)) : 0;
    const base = correct ? 100 : 0;
    const score = base + speedBonus + dataBonus + hits * 10;
    setCaseScore(score);
    setTotalScore((s) => s + score);
    setCaseNote(note);
    setPhase("caseResult");
  };

  const nextCase = () => {
    if (caseIndex + 1 >= CASES.length) setPhase("final");
    else startCase(caseIndex + 1);
  };

  if (phase === "intro") {
    return <CrackTheBotIntro onDone={() => startCase(0)} />;
  }

  const obs = session.slice(0, visible);
  const recent = obs.slice(-14);
  const threshold = bonferroniThreshold(PREDICTORS.length);

  const testedIds = PREDICTORS.filter((pr) => tested[pr.id]).map((pr) => pr.id);
  const confoundZOptions = confoundX ? PREDICTORS.filter((pr) => pr.id !== confoundX) : [];
  const CONFOUND_CHOICES = ["Shrinks toward zero", "Grows stronger", "Stays about the same"];

  let confoundMulti: MultiRegressionResult | null = null;
  let confoundAux: RegressionResult | null = null;
  let confoundCorrectChoice: string | null = null;
  if (confoundX && confoundZ && tested[confoundX]) {
    confoundMulti = multiRegress(obs, confoundX, confoundZ);
    confoundAux = auxRegress(obs, confoundX, confoundZ);
    const naiveAbs = Math.abs(tested[confoundX].slope);
    const partialAbs = Math.abs(confoundMulti.betaX);
    const ratio = naiveAbs < 1e-6 ? 1 : partialAbs / naiveAbs;
    confoundCorrectChoice = ratio < 0.7 ? "Shrinks toward zero" : ratio > 1.3 ? "Grows stronger" : "Stays about the same";
  }
  const confoundCorrect = confoundChecked && confoundChoice === confoundCorrectChoice;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Crack the Bot</h1>

      {phase === "briefing" && (
        <div className="pixel-stage">
          <p className="quiz-panel-title" style={{ marginBottom: 10 }}>
            Case {caseIndex + 1} of {CASES.length}
          </p>
          <p className="mm-teach-note" style={{ marginBottom: 18 }}>
            {spec.brief}
          </p>
          <p className="ctb-briefing-rules">
            {START_TICKS} ticks free · pulling more costs clock · {fmtClock(CASE_MS)} on the case
          </p>
          <button
            type="button"
            className="continue-btn"
            onClick={() => {
              deadline.current = Date.now() + CASE_MS;
              setPhase("observing");
            }}
          >
            Open the tape
          </button>
        </div>
      )}

      {(phase === "observing" || phase === "predicting") && (
        <div className="pixel-stage">
          <div className="ctb-hud">
            <span className="qty-hint">
              Case {caseIndex + 1}/{CASES.length}
            </span>
            <span className={clock < 20000 ? "ctb-clock is-low" : "ctb-clock"}>{fmtClock(clock)}</span>
            <span className="qty-hint">{visible} ticks</span>
          </div>

          <table className="ctb-tape">
            <thead>
              <tr>
                <th>TICK</th>
                <th>MOVE</th>
                <th>BOT</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.tick}>
                  <td>{o.tick}</td>
                  <td className={o.change >= 0 ? "is-up" : "is-down"}>
                    {o.change >= 0 ? "+" : ""}
                    {o.change}
                  </td>
                  <td className={o.action === 1 ? "is-buy" : "is-sell"}>{o.action === 1 ? "BUY" : "SELL"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {phase === "observing" && (
            <>
              <div className="answer-crew-picker" style={{ marginTop: 10, marginBottom: 4 }}>
                <button type="button" className="chip-btn" onClick={() => pullTicks(5)}>
                  Pull 5 more ticks (−{TICK_COST_MS / 1000}s)
                </button>
                <button type="button" className="chip-btn" onClick={() => pullTicks(25)}>
                  Pull 25 more (−{(TICK_COST_MS * 5) / 1000}s)
                </button>
              </div>

              <p className="quiz-panel-title" style={{ marginTop: 14, marginBottom: 2 }}>
                Regress the bot&apos;s action on…
              </p>
              <p className="mm-step-hint">
                Three tests, so the honest significance bar is p &lt; {threshold.toFixed(4)}, not 0.05.
              </p>

              <div className="ctb-tests">
                {PREDICTORS.map((pr) => {
                  const r = tested[pr.id];
                  return (
                    <div key={pr.id} className={r && r.pValue < threshold ? "ctb-test is-hot" : "ctb-test"}>
                      <span className="ctb-test-label">{pr.label}</span>
                      {r ? (
                        <span className="ctb-test-out">
                          β={r.slope.toFixed(3)} · t={r.tStat.toFixed(2)} · p=
                          {r.pValue < 0.0001 ? "<0.0001" : r.pValue.toFixed(4)} · n={r.n}
                        </span>
                      ) : (
                        <button type="button" className="chip-btn" onClick={() => runTest(pr.id)}>
                          Run regression
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {testedIds.length > 0 && (
                <div className="quiz-panel" style={{ marginTop: 16 }}>
                  <p className="quiz-panel-title">Confounder check</p>
                  <p className="mm-step-hint">
                    A significant slope on one predictor can just be it riding along with the real driver — these
                    predictors overlap (ma5&apos;s window contains lag1 and lag3). Pick a suspect you&apos;ve tested,
                    pick something to control for, and see if the effect survives.
                  </p>

                  <p className="ctb-test-label" style={{ marginTop: 8 }}>
                    X — your suspect
                  </p>
                  <div className="answer-crew-picker">
                    {PREDICTORS.filter((pr) => testedIds.includes(pr.id)).map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        className={confoundX === pr.id ? "chip-btn active" : "chip-btn"}
                        onClick={() => {
                          setConfoundX(pr.id);
                          setConfoundZ(null);
                          setConfoundChoice(null);
                          setConfoundChecked(false);
                        }}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>

                  {confoundX && (
                    <>
                      <p className="ctb-test-label" style={{ marginTop: 8 }}>
                        Z — control for
                      </p>
                      <div className="answer-crew-picker">
                        {confoundZOptions.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            className={confoundZ === pr.id ? "chip-btn active" : "chip-btn"}
                            onClick={() => {
                              setConfoundZ(pr.id);
                              setConfoundChoice(null);
                              setConfoundChecked(false);
                            }}
                          >
                            {pr.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {confoundX && confoundZ && (
                    <div className={confoundChecked ? (confoundCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"} style={{ marginTop: 10 }}>
                      <p className="quiz-q-topic">Omitted-variable bias</p>
                      <p className="quiz-q-prompt">
                        Naive slope on &ldquo;{PREDICTORS.find((p) => p.id === confoundX)?.label}&rdquo; was{" "}
                        {tested[confoundX].slope.toFixed(3)} (t={tested[confoundX].tStat.toFixed(2)}). Once you control
                        for &ldquo;{PREDICTORS.find((p) => p.id === confoundZ)?.label}&rdquo;, what happens to that
                        slope?
                      </p>
                      <div className="answer-crew-picker">
                        {CONFOUND_CHOICES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={confoundChoice === c ? "chip-btn active" : "chip-btn"}
                            disabled={confoundChecked}
                            onClick={() => setConfoundChoice(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      {!confoundChecked && (
                        <button
                          type="button"
                          className="chip-btn"
                          disabled={!confoundChoice}
                          onClick={() => setConfoundChecked(true)}
                          style={{ marginTop: 10 }}
                        >
                          Check
                        </button>
                      )}
                      {confoundChecked && confoundMulti && confoundAux && (
                        <p className={confoundCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                          {confoundCorrect ? "✓ Correct. " : `✗ It actually ${confoundCorrectChoice!.toLowerCase()}. `}
                          Controlling for Z: partial β on X = {confoundMulti.betaX.toFixed(3)} (t=
                          {confoundMulti.tX.toFixed(2)}), partial β on Z = {confoundMulti.betaZ.toFixed(3)} (t=
                          {confoundMulti.tZ.toFixed(2)}). Aux slope (Z on X) = {confoundAux.slope.toFixed(3)} — the bias
                          in the naive estimate is β_Z(partial) × that aux slope ≈{" "}
                          {(confoundMulti.betaZ * confoundAux.slope).toFixed(3)}, which is close to naive − partial ={" "}
                          {(tested[confoundX].slope - confoundMulti.betaX).toFixed(3)}. Same number either way you get
                          there — that's the identity, not a coincidence.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="quiz-panel-title" style={{ marginTop: 16, marginBottom: 8 }}>
                Call it
              </p>
              <div className="answer-crew-picker">
                {RULE_ORDER.map((r) => (
                  <button key={r} type="button" className="chip-btn" onClick={() => lockIn(r)}>
                    {RULE_LABEL[r]}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === "predicting" && (
            <>
              <p className="quiz-panel-title" style={{ marginTop: 14, marginBottom: 2 }}>
                Prove it — call its next {PREDICTIONS} moves
              </p>
              <p className="mm-step-hint">
                You said: {guess ? RULE_LABEL[guess] : ""}. Prediction {predictions.length + 1} of {PREDICTIONS}.
              </p>
              <div className="answer-crew-picker">
                <button type="button" className="chip-btn" onClick={() => makePrediction(1)}>
                  It BUYS next
                </button>
                <button type="button" className="chip-btn" onClick={() => makePrediction(-1)}>
                  It SELLS next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "caseResult" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={caseScore > 0 ? "win" : "loss"}
            title={caseScore > 0 ? "CASE CLOSED" : "CASE LOST"}
            sub={`${caseScore} points · running total ${totalScore + 0}`}
          />
          <p className="mm-teach-note" style={{ marginTop: 12 }}>
            {caseNote}
          </p>
          <p className="mm-teach-note">You used {visible} ticks of data.</p>
          <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={nextCase}>
            {caseIndex + 1 >= CASES.length ? "See final score" : "Next case"}
          </button>
        </div>
      )}

      {phase === "final" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={totalScore >= 300 ? "win" : "loss"}
            title={totalScore >= 300 ? "DESK CLEARED" : "SESSION OVER"}
            sub={`${totalScore} points across ${CASES.length} cases`}
          />
          <button
            type="button"
            className="chip-btn"
            style={{ marginTop: 16 }}
            onClick={() => {
              setTotalScore(0);
              setPhase("intro");
            }}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
