"use client";

import { useState } from "react";

// Shell only: the tracker is local, in-memory, and deliberately not wired to
// storage or a backend yet — it exists to show the shape of the feature.
type JobRow = {
  company: string;
  role: string;
  applied: string;
  stage: "Applied" | "OA" | "Phone" | "Onsite" | "Offer" | "Rejected";
};

const SAMPLE: JobRow[] = [
  { company: "Jane Street", role: "Quant Trader", applied: "2026-08-02", stage: "OA" },
  { company: "Optiver", role: "Quant Researcher", applied: "2026-08-05", stage: "Phone" },
  { company: "Analysis Group", role: "Economic Analyst", applied: "2026-08-09", stage: "Applied" },
  { company: "Citadel", role: "Quant Developer", applied: "2026-07-28", stage: "Rejected" },
];

const STAGES: JobRow["stage"][] = ["Applied", "OA", "Phone", "Onsite", "Offer", "Rejected"];

export default function JobsPanel() {
  const [rows] = useState<JobRow[]>(SAMPLE);

  const counts = STAGES.map((stage) => ({ stage, n: rows.filter((r) => r.stage === stage).length }));

  return (
    <div className="hub-panel">
      <section className="section">
        <h2>My Jobs</h2>
        <p className="section-intro">
          Every application in one place — where it is, what is next, and what went cold.
        </p>

        <div className="jobs-summary">
          {counts.map(({ stage, n }) => (
            <div className="jobs-stat" key={stage}>
              <strong>{n}</strong>
              <span>{stage}</span>
            </div>
          ))}
        </div>

        <div className="jobs-table" role="table" aria-label="Job applications">
          <div className="jobs-row is-head" role="row">
            <span role="columnheader">Company</span>
            <span role="columnheader">Role</span>
            <span role="columnheader">Applied</span>
            <span role="columnheader">Stage</span>
          </div>
          {rows.map((r) => (
            <div className="jobs-row" role="row" key={`${r.company}-${r.role}`}>
              <span role="cell"><strong>{r.company}</strong></span>
              <span role="cell">{r.role}</span>
              <span role="cell" className="jobs-date">{r.applied}</span>
              <span role="cell">
                <span className={`jobs-stage is-${r.stage.toLowerCase()}`}>{r.stage}</span>
              </span>
            </div>
          ))}
        </div>

        <p className="assess-footnote">
          Shell only — these are example rows. Adding, editing, and syncing come once there is an
          account to attach them to.
        </p>
      </section>
    </div>
  );
}
