"use client";

import GateBars, { useAssessmentGate } from "./GateBars";

// Same three-condition gate as the assessments, but its own section: a mock
// interview is a different format (spoken reasoning, follow-up questions)
// rather than another graded exam.
const FORMATS = [
  {
    title: "Technical screen",
    blurb: "One interviewer, one problem, thinking out loud under time pressure.",
  },
  {
    title: "Brainteaser round",
    blurb: "Rapid-fire puzzles with follow-ups that punish a memorised answer.",
  },
  {
    title: "Behavioral + fit",
    blurb: "Why this desk, why this firm, and what you did when the trade went wrong.",
  },
];

export default function MockInterviewBoard() {
  const gate = useAssessmentGate();

  return (
    <section className="section">
      <h2>Mock Interview Lab</h2>
      <p className="section-intro">
        An interviewer asks, you answer, and they push back on the reasoning - closer to the real
        thing than a multiple-choice screen.
      </p>

      <GateBars />

      <div className="assess-list">
        {FORMATS.map((format) => (
          <div
            className={gate.unlocked ? "assess-card is-unlocked" : "assess-card"}
            key={format.title}
            aria-disabled={!gate.unlocked}
          >
            <span className="assess-card-icon" aria-hidden="true">{gate.unlocked ? "▶" : "■"}</span>
            <span className="assess-card-body">
              <strong>{format.title}</strong>
              <span>{format.blurb}</span>
            </span>
            <span className="assess-card-state">{gate.unlocked ? "Coming soon" : "Locked"}</span>
          </div>
        ))}
      </div>

      <p className="assess-footnote">
        {gate.unlocked
          ? "Requirements met - the mock interview lab is still being built."
          : "Same unlock as assessments: an Infinity Pass, the reps, and the accuracy to back it up."}
      </p>
    </section>
  );
}
