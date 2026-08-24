"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALL_DISTS,
  buildSpec,
  histogram,
  makeRng,
  randomSeed,
  sample,
  sampleMeans,
  sampleStats,
  type DistId,
  type DistSpec,
} from "./distMath";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import DistributionsIntro from "./DistributionsIntro";

const CASES: DistId[] = ["uniform", "exponential", "poisson", "binomial", "lognormal"];
const START_DRAWS = 30;
const DRAW_COST_MS = 3000;
const CASE_MS = 100000;

type Phase = "intro" | "identifying" | "moments" | "caseResult" | "clt" | "final";

function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Histo({ values, accent }: { values: number[]; accent?: boolean }) {
  const h = histogram(values, 22);
  const peak = Math.max(...h.bins, 1);
  return (
    <div className="dist-histo">
      {h.bins.map((count, i) => (
        <div
          key={i}
          className={accent ? "dist-bar is-accent" : "dist-bar"}
          style={{ height: `${(count / peak) * 100}%` }}
          title={`${count}`}
        />
      ))}
    </div>
  );
}

export default function DistributionsGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [caseIndex, setCaseIndex] = useState(0);
  const [spec, setSpec] = useState<DistSpec | null>(null);
  const [values, setValues] = useState<number[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [guess, setGuess] = useState<DistId | null>(null);
  const [momentAsk, setMomentAsk] = useState<"mean" | "variance">("mean");
  const [momentAnswer, setMomentAnswer] = useState("");
  const [momentChecked, setMomentChecked] = useState(false);
  const [clock, setClock] = useState(CASE_MS);
  const [totalScore, setTotalScore] = useState(0);
  const [caseScore, setCaseScore] = useState(0);
  const [caseNote, setCaseNote] = useState("");

  // CLT round
  const [cltN, setCltN] = useState(1);
  const [cltSpec, setCltSpec] = useState<DistSpec | null>(null);
  const [cltValues, setCltValues] = useState<number[]>([]);
  const [cltAnswer, setCltAnswer] = useState("");
  const [cltChecked, setCltChecked] = useState(false);

  const rngRef = useRef<() => number>(() => Math.random());
  const deadline = useRef(0);

  useEffect(() => {
    if (phase !== "identifying" && phase !== "moments") return;
    const t = window.setInterval(() => {
      const left = deadline.current - Date.now();
      setClock(left);
      if (left <= 0) {
        window.clearInterval(t);
        finishCase(false, "Out of time.");
      }
    }, 100);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, caseIndex]);

  const startCase = (i: number) => {
    const rng = makeRng(randomSeed());
    rngRef.current = rng;
    const s = buildSpec(CASES[i], rng);
    setSpec(s);
    setValues(Array.from({ length: START_DRAWS }, () => sample(s, rng)));
    setShowStats(false);
    setGuess(null);
    setMomentAnswer("");
    setMomentChecked(false);
    setMomentAsk(Math.random() < 0.5 ? "mean" : "variance");
    setCaseIndex(i);
    setCaseScore(0);
    setCaseNote("");
    deadline.current = Date.now() + CASE_MS;
    setClock(CASE_MS);
    setPhase("identifying");
  };

  const drawMore = (n: number) => {
    if (!spec) return;
    const rng = rngRef.current;
    setValues((v) => [...v, ...Array.from({ length: n }, () => sample(spec, rng))]);
    deadline.current -= DRAW_COST_MS * (n / 30);
  };

  const lockGuess = (id: DistId) => {
    if (!spec) return;
    setGuess(id);
    if (id !== spec.id) {
      finishCase(false, `Wrong — that was ${spec.label}. ${spec.tell}`);
      return;
    }
    setPhase("moments");
  };

  const checkMoment = () => {
    if (!spec) return;
    setMomentChecked(true);
    const truth = momentAsk === "mean" ? spec.mean : spec.variance;
    const got = Number(momentAnswer.trim());
    const ok = Number.isFinite(got) && Math.abs(got - truth) <= Math.max(0.15, Math.abs(truth) * 0.03);
    const timeLeft = Math.max(0, deadline.current - Date.now());
    const speed = Math.round((timeLeft / CASE_MS) * 40);
    const dataBonus = Math.max(0, 30 - Math.floor((values.length - START_DRAWS) / 30) * 10);
    const score = 80 + (ok ? 50 : 0) + speed + dataBonus;
    setCaseScore(score);
    setTotalScore((s) => s + score);
    setCaseNote(
      ok
        ? `Identified ${spec.label} and got the ${momentAsk} right (${truth.toFixed(2)}). ${spec.tell}`
        : `Identified ${spec.label}, but the ${momentAsk} is ${truth.toFixed(2)}, not ${momentAnswer || "—"}. ${spec.tell}`
    );
    setPhase("caseResult");
  };

  const finishCase = (_ok: boolean, note: string) => {
    setCaseScore(0);
    setCaseNote(note);
    setPhase("caseResult");
  };

  const nextCase = () => {
    if (caseIndex + 1 >= CASES.length) startClt();
    else startCase(caseIndex + 1);
  };

  const startClt = () => {
    const rng = makeRng(randomSeed());
    rngRef.current = rng;
    const s = buildSpec("exponential", rng);
    setCltSpec(s);
    setCltN(1);
    setCltValues(Array.from({ length: 2000 }, () => sample(s, rng)));
    setCltAnswer("");
    setCltChecked(false);
    setPhase("clt");
  };

  const setCltSampleSize = (n: number) => {
    if (!cltSpec) return;
    const rng = rngRef.current;
    setCltN(n);
    setCltValues(n === 1 ? Array.from({ length: 2000 }, () => sample(cltSpec, rng)) : sampleMeans(cltSpec, rng, n, 2000));
  };

  const stats = sampleStats(values);
  const cltStats = sampleStats(cltValues);

  if (phase === "intro") return <DistributionsIntro onDone={() => startCase(0)} />;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quant Interview Prep Lab</p>
      <h1 className="pirate-story-line answer-title">Read the Shape</h1>

      {(phase === "identifying" || phase === "moments") && spec && (
        <div className="pixel-stage">
          <div className="ctb-hud">
            <span className="qty-hint">
              Case {caseIndex + 1}/{CASES.length}
            </span>
            <span className={clock < 20000 ? "ctb-clock is-low" : "ctb-clock"}>{fmtClock(clock)}</span>
            <span className="qty-hint">{values.length} draws</span>
          </div>

          <Histo values={values} />

          {showStats ? (
            <div className="dist-stats">
              <span>
                mean <strong>{stats.mean.toFixed(2)}</strong>
              </span>
              <span>
                var <strong>{stats.variance.toFixed(2)}</strong>
              </span>
              <span>
                skew <strong>{stats.skew.toFixed(2)}</strong>
              </span>
            </div>
          ) : (
            <button type="button" className="chip-btn" style={{ marginTop: 10 }} onClick={() => setShowStats(true)}>
              Run diagnostics (mean / variance / skew)
            </button>
          )}

          {phase === "identifying" && (
            <>
              <div className="answer-crew-picker" style={{ marginTop: 12, marginBottom: 4 }}>
                <button type="button" className="chip-btn" onClick={() => drawMore(30)}>
                  Draw 30 more (−{DRAW_COST_MS / 1000}s)
                </button>
                <button type="button" className="chip-btn" onClick={() => drawMore(300)}>
                  Draw 300 more (−{(DRAW_COST_MS * 10) / 1000}s)
                </button>
              </div>

              <p className="quiz-panel-title" style={{ marginTop: 14, marginBottom: 8 }}>
                What&apos;s generating this?
              </p>
              <div className="answer-crew-picker">
                {ALL_DISTS.map((d) => (
                  <button key={d} type="button" className="chip-btn" onClick={() => lockGuess(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === "moments" && (
            <>
              <p className="quiz-panel-title" style={{ marginTop: 14, marginBottom: 2 }}>
                Correct — {spec.label}. Now the formula.
              </p>
              <p className="mm-step-hint">
                Parameters:{" "}
                {Object.entries(spec.params)
                  .map(([k, v]) => `${k} = ${v}`)
                  .join(", ")}
                . What is the <strong>{momentAsk}</strong>?
              </p>
              <div className="quiz-q-input-row" style={{ justifyContent: "center" }}>
                <input
                  type="text"
                  className="quiz-q-input"
                  placeholder="type a number"
                  value={momentAnswer}
                  onChange={(e) => setMomentAnswer(e.target.value)}
                  disabled={momentChecked}
                />
                <button type="button" className="chip-btn" disabled={!momentAnswer} onClick={checkMoment}>
                  Check
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
            title={caseScore > 0 ? "IDENTIFIED" : "MISREAD"}
            sub={`${caseScore} points · total ${totalScore}`}
          />
          <p className="mm-teach-note" style={{ marginTop: 12 }}>
            {caseNote}
          </p>
          {spec && (
            <p className="mm-teach-note">
              <strong>Where it shows up:</strong> {spec.quantUse}
            </p>
          )}
          <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={nextCase}>
            {caseIndex + 1 >= CASES.length ? "Final round" : "Next case"}
          </button>
        </div>
      )}

      {phase === "clt" && cltSpec && (
        <div className="pixel-stage">
          <p className="quiz-panel-title" style={{ marginBottom: 2 }}>
            Final round — the Central Limit Theorem
          </p>
          <p className="mm-step-hint">
            The source is exponential: strictly positive, heavily right-skewed, nothing like a bell. Now average{" "}
            <strong>n</strong> draws at a time and watch what the averages do.
          </p>

          <Histo values={cltValues} accent={cltN > 1} />

          <div className="dist-stats">
            <span>
              n = <strong>{cltN}</strong>
            </span>
            <span>
              mean <strong>{cltStats.mean.toFixed(2)}</strong>
            </span>
            <span>
              var <strong>{cltStats.variance.toFixed(2)}</strong>
            </span>
            <span>
              skew <strong>{cltStats.skew.toFixed(2)}</strong>
            </span>
          </div>

          <div className="answer-crew-picker" style={{ marginTop: 12 }}>
            {[1, 2, 5, 10, 30].map((n) => (
              <button key={n} type="button" className={cltN === n ? "chip-btn active" : "chip-btn"} onClick={() => setCltSampleSize(n)}>
                average {n}
              </button>
            ))}
          </div>

          <p className="mm-teach-note" style={{ marginTop: 12 }}>
            Skew started near 2.0 and collapses toward 0 as n grows — the averages go normal even though the source never
            does. That&apos;s the CLT, and it&apos;s why portfolio returns look tamer than the trades inside them.
          </p>

          <p className="quiz-panel-title" style={{ marginTop: 16, marginBottom: 2 }}>
            The formula that matters
          </p>
          <p className="mm-step-hint">
            The source has variance σ² = {cltSpec.variance.toFixed(2)}. What is the variance of the mean of{" "}
            {cltN === 1 ? 30 : cltN} draws?
          </p>
          <div className="quiz-q-input-row" style={{ justifyContent: "center" }}>
            <input
              type="text"
              className="quiz-q-input"
              placeholder="type a number"
              value={cltAnswer}
              onChange={(e) => setCltAnswer(e.target.value)}
              disabled={cltChecked}
            />
            <button
              type="button"
              className="chip-btn"
              disabled={!cltAnswer}
              onClick={() => {
                const n = cltN === 1 ? 30 : cltN;
                const truth = cltSpec.variance / n;
                const got = Number(cltAnswer.trim());
                const ok = Number.isFinite(got) && Math.abs(got - truth) <= Math.max(0.05, truth * 0.05);
                setCltChecked(true);
                setTotalScore((s) => s + (ok ? 150 : 0));
                setCaseNote(
                  ok
                    ? `Correct — Var(X̄) = σ²/n = ${cltSpec.variance.toFixed(2)}/${n} = ${truth.toFixed(3)}.`
                    : `Not quite — Var(X̄) = σ²/n = ${cltSpec.variance.toFixed(2)}/${n} = ${truth.toFixed(3)}. Averaging n draws divides the variance by n, so the standard error shrinks like 1/√n.`
                );
              }}
            >
              Check
            </button>
          </div>

          {cltChecked && (
            <>
              <p className="mm-teach-note" style={{ marginTop: 12 }}>
                {caseNote}
              </p>
              <button type="button" className="chip-btn" style={{ marginTop: 12 }} onClick={() => setPhase("final")}>
                Finish
              </button>
            </>
          )}
        </div>
      )}

      {phase === "final" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={totalScore >= 400 ? "win" : "loss"}
            title={totalScore >= 400 ? "SHAPES READ" : "SESSION OVER"}
            sub={`${totalScore} points`}
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
