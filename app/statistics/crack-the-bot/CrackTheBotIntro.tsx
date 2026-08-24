"use client";

import { useState } from "react";
import { AccessStartButton } from "../../access/TokenPlayButton";

// Short worked-example tutorial. The one thing a player must leave with is
// how to read a t-stat, because every case is decided on it.

type Step = { term: string; body: string; note?: string; demo?: "table" | "tstat" | "trap" };

const STEPS: Step[] = [
  {
    term: "The job",
    body: "A rival algorithm is trading in your market. It follows one fixed rule. Nobody will tell you what it is — you have to work it out from what it does.",
    note: "Crack it, and you can predict its next move before it makes it.",
  },
  {
    term: "What you see",
    body: "Each tick you get the price move and what the bot did — BUY, or SELL. That's it. The rule is hidden underneath.",
    demo: "table",
  },
  {
    term: "The hypotheses",
    body: "It's watching one of three things: the previous tick's move, the move 3 ticks ago, or the average of the last 5. Or it has no rule at all and is trading randomly.",
    note: "Four possibilities. One of them is 'there's nothing here'.",
  },
  {
    term: "Reading a t-stat",
    body: "Regress the bot's action on each candidate. The t-stat tells you how many standard errors the relationship sits from zero. Rough rule: |t| above 2 is a real relationship, below 2 is noise.",
    demo: "tstat",
    note: "The p-value is the same fact stated differently: below 0.05 means unlikely to be chance.",
  },
  {
    term: "The trap",
    body: "You're testing three hypotheses at once. Test enough things and one WILL cross 2 by luck alone — roughly a 1-in-7 chance across three tests even when nothing is there.",
    demo: "trap",
    note: "So the honest bar for three tests is p < 0.0167, not 0.05. That's a Bonferroni correction.",
  },
  {
    term: "The clock",
    body: "More data means a sharper t-stat — but you're on a timer, and every extra tick you request burns it. Deciding when you have enough evidence IS the skill.",
    note: "Call it early and right for the biggest score. Call it wrong and you lose the case.",
  },
];

function DemoTable() {
  const rows = [
    { t: 41, move: "+3", act: "BUY" },
    { t: 42, move: "-2", act: "SELL" },
    { t: 43, move: "-4", act: "SELL" },
    { t: 44, move: "+1", act: "BUY" },
  ];
  return (
    <table className="ctb-demo-table">
      <thead>
        <tr>
          <th>TICK</th>
          <th>MOVE</th>
          <th>BOT</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.t}>
            <td>{r.t}</td>
            <td className={r.move.startsWith("+") ? "is-up" : "is-down"}>{r.move}</td>
            <td className={r.act === "BUY" ? "is-buy" : "is-sell"}>{r.act}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DemoTStat({ trap }: { trap?: boolean }) {
  const rows = trap
    ? [
        { label: "Previous tick", t: 2.11, p: 0.035, verdict: "looks real — but see below" },
        { label: "3 ticks ago", t: 0.44, p: 0.66, verdict: "noise" },
        { label: "5-tick average", t: 1.02, p: 0.31, verdict: "noise" },
      ]
    : [
        { label: "Previous tick", t: 6.42, p: 0.0001, verdict: "real signal" },
        { label: "3 ticks ago", t: 0.31, p: 0.76, verdict: "noise" },
        { label: "5-tick average", t: 1.18, p: 0.24, verdict: "noise" },
      ];
  return (
    <div className="ctb-demo-tstat">
      {rows.map((r) => (
        <div key={r.label} className={Math.abs(r.t) > 2 ? "ctb-tstat-row is-hot" : "ctb-tstat-row"}>
          <span className="ctb-tstat-label">{r.label}</span>
          <span className="ctb-tstat-val">t = {r.t.toFixed(2)}</span>
          <span className="ctb-tstat-p">p = {r.p < 0.001 ? "<0.001" : r.p.toFixed(3)}</span>
          <span className="ctb-tstat-verdict">{r.verdict}</span>
        </div>
      ))}
      {trap && <p className="ctb-demo-warning">p = 0.035 clears 0.05 — but not the corrected 0.0167 bar. This is a false positive.</p>}
    </div>
  );
}

export default function CrackTheBotIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quant Interview Prep Lab</p>
      <h1 className="pirate-story-line answer-title">Crack the Bot</h1>

      <div className="pixel-stage">
        <p className="mm-teach-progress">
          {step + 1} / {STEPS.length}
        </p>

        {current.demo === "table" && <DemoTable />}
        {current.demo === "tstat" && <DemoTStat />}
        {current.demo === "trap" && <DemoTStat trap />}

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
            <AccessStartButton gameId="statistics-crack-the-bot" title="Crack the Bot" defaultLabel="Start" className="hs-chunky-btn" onStart={onDone}>
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
