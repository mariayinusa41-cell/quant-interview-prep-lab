"use client";

import { useEffect, useState } from "react";

// A real tracker: rows are added, edited, and removed by the player and
// persisted in this browser (localStorage), not a hardcoded sample list.
// There's no account system yet, so this is per-device rather than synced
// across devices — the moment there's an account to attach it to, swapping
// the load/save calls below for API calls is the only change needed.

type Stage = "Applied" | "OA" | "Phone" | "Onsite" | "Offer" | "Rejected";

type JobRow = {
  id: string;
  company: string;
  role: string;
  applied: string;
  stage: Stage;
};

const STAGES: Stage[] = ["Applied", "OA", "Phone", "Onsite", "Offer", "Rejected"];
const STORAGE_KEY = "qipl-jobs-v1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function loadJobs(): JobRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is JobRow =>
        r && typeof r.id === "string" && typeof r.company === "string" && typeof r.role === "string"
    );
  } catch {
    return [];
  }
}

function saveJobs(rows: JobRow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export default function JobsPanel() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  // Load once on mount, client-side only — avoids a hydration mismatch
  // between server render (no localStorage) and the browser's real state.
  useEffect(() => {
    setRows(loadJobs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveJobs(rows);
  }, [rows, loaded]);

  const addJob = () => {
    const c = company.trim();
    const r = role.trim();
    if (!c || !r) return;
    setRows((prev) => [{ id: crypto.randomUUID(), company: c, role: r, applied: todayIso(), stage: "Applied" }, ...prev]);
    setCompany("");
    setRole("");
  };

  const setStage = (id: string, stage: Stage) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, stage } : row)));
  };

  const removeJob = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const counts = STAGES.map((stage) => ({ stage, n: rows.filter((r) => r.stage === stage).length }));
  const total = rows.length;
  const stageClass = (stage: Stage) => `stage-${stage.toLowerCase()}`;

  return (
    <div className="hub-panel">
      <section className="arc-hero is-neutral" aria-label="Application pipeline">
        <div className="arc-hero-body">
          <p className="arc-eyebrow">
            Run in progress // {total} application{total === 1 ? "" : "s"} live
          </p>
          <h2 className="arc-hero-title">The pipeline</h2>
          <div className="arc-stage-grid">
            {counts.map(({ stage, n }) => (
              <div className="arc-stage" key={stage}>
                <span className={`arc-stage-n ${stageClass(stage)}`}>{n}</span>
                <span className="arc-stage-label">{stage}</span>
                {/* Share of the whole run, which is what makes this read as a
                    funnel rather than six unrelated numbers. */}
                <span className="arc-stage-bar" aria-hidden="true">
                  <span
                    className={stageClass(stage)}
                    style={{ width: total === 0 ? "0%" : `${Math.round((n / total) * 100)}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Applications</h2>

        <div className="arc-job-add">
          <input
            type="text"
            className="arc-job-input"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addJob()}
          />
          <input
            type="text"
            className="arc-job-input"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addJob()}
          />
          <button type="button" className="arc-job-add-btn" disabled={!company.trim() || !role.trim()} onClick={addJob}>
            + Add application
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="arc-job-table" role="table" aria-label="Job applications">
            <div className="arc-job-head" role="row">
              <span role="columnheader">Company</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Applied</span>
              <span role="columnheader">Stage</span>
              <span role="columnheader" aria-hidden="true" />
            </div>
            {rows.map((r) => (
              <div className="arc-job-row" role="row" key={r.id}>
                <span role="cell" className="arc-job-company">{r.company}</span>
                <span role="cell" className="arc-job-role">{r.role}</span>
                <span role="cell" className="arc-job-date">{r.applied}</span>
                <span role="cell">
                  <select
                    className={`arc-job-stage ${stageClass(r.stage)}`}
                    value={r.stage}
                    onChange={(e) => setStage(r.id, e.target.value as Stage)}
                    aria-label={`Stage for ${r.company} ${r.role}`}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </span>
                <span role="cell">
                  <button type="button" className="arc-job-remove" onClick={() => removeJob(r.id)} aria-label={`Remove ${r.company}`}>
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="arc-note">No applications yet - add your first one above.</p>
        )}
      </section>
    </div>
  );
}
