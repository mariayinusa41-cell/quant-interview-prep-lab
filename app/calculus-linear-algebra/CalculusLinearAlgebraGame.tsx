"use client";

import { useState } from "react";
import PSDClassifier from "./PSDClassifier";
import EigenvectorSpotter from "./EigenvectorSpotter";
import TaylorSlider from "./TaylorSlider";
import LagrangeOptimizer from "./LagrangeOptimizer";
import NewtonStepper from "./NewtonStepper";
import "./calc.css";

type Mode = "psd" | "eigen" | "taylor" | "lagrange" | "newton";

const MODES: { id: Mode; title: string; tag: string }[] = [
  { id: "taylor", title: "Taylor Slider", tag: "Local approximation" },
  { id: "lagrange", title: "Lagrange Optimizer", tag: "Constrained optimization" },
  { id: "eigen", title: "Eigenvector Spotter", tag: "Invariant directions" },
  { id: "psd", title: "PSD Classifier", tag: "Covariance validity" },
  { id: "newton", title: "Newton Stepper", tag: "Root finding" },
];

export default function CalculusLinearAlgebraGame() {
  const [mode, setMode] = useState<Mode>("taylor");

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Calculus / Linear Algebra // Procedural Lab</p>
      <h1 className="pirate-story-line answer-title">Gradient Lab</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        Five procedurally generated games - every matrix, function, and root is computed fresh each round, so there's
        no fixed answer key to memorize.
      </p>

      <div className="calc-mode-chips">
        {MODES.map((m) => (
          <button
            type="button"
            key={m.id}
            className={mode === m.id ? "calc-chip active" : "calc-chip"}
            onClick={() => setMode(m.id)}
          >
            {m.title}
          </button>
        ))}
      </div>
      <p className="calc-mode-tag">{MODES.find((m) => m.id === mode)?.tag}</p>

      {mode === "psd" && <PSDClassifier />}
      {mode === "eigen" && <EigenvectorSpotter />}
      {mode === "taylor" && <TaylorSlider />}
      {mode === "lagrange" && <LagrangeOptimizer />}
      {mode === "newton" && <NewtonStepper />}
    </div>
  );
}
