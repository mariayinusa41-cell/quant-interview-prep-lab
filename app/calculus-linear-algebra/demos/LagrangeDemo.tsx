"use client";

import type { DemoStep } from "../CalcWalkthrough";

// A played round of Lagrange Optimizer: maximize xy s.t. 2x + 3y = 12.
// Verified against calcMath's lagrangeSolution —
//   λ = k/(2ab) = 12/12 = 1,  x* = λb = 3,  y* = λa = 2,  xy = 6

function Board({ typed, reveal }: { typed?: string; reveal?: boolean }) {
  return (
    <div className="calc-taylor-panel">
      <p className="calc-taylor-target">
        Maximize f(x, y) = xy subject to 2x + 3y = <strong>12</strong>, x, y ≥ 0. What is x* at the optimum?
      </p>
      <p className="mm-step-hint" style={{ marginBottom: 10 }}>
        ∇f = (y, x), ∇g = (2, 3). Setting ∇f = λ∇g gives y = λ2, x = λ3 - substitute both into the constraint to
        solve for λ, then x*.
      </p>

      <div className="quiz-q-input-row">
        <input type="text" className="quiz-q-input" placeholder="type x*" value={typed ?? ""} readOnly disabled />
      </div>

      {reveal && (
        <p className="quiz-q-explain is-correct" style={{ marginTop: 10 }}>
          ✓ Correct. λ = k / (2ab) = 12 / (2·2·3) = 1.000, so x* = λ3 = 3.000 and y* = λ2 = 2.000. Check: 2(3.00) +
          3(2.00) ≈ 12, and the maximum value of xy is 6.000.
        </p>
      )}
    </div>
  );
}

export const LAGRANGE_DEMO: DemoStep[] = [
  {
    term: "This is the board",
    body:
      "The objective is always xy. What changes each round is the budget line - the two coefficients and the total. You return x*, the x-coordinate of the constrained maximum, as a number.",
    board: <Board />,
    note: "The hint line under the question already sets up the method. It's telling you what to do; the rest is execution.",
  },
  {
    term: "Write the Lagrange condition",
    body:
      "At a constrained optimum the two gradients are parallel - not equal, parallel, with λ absorbing the scale. That single vector equation is the entire method, and everything below is just unpacking it.",
    board: <Board />,
    math: ["∇f  =  λ ∇g", "∇f  =  (y, x)", "∇g  =  (a, b)  =  (2, 3)"],
    note: "Geometrically: the curve xy = c is tangent to the budget line exactly at the optimum.",
  },
  {
    term: "Split it into components",
    body:
      "Read the vector equation one coordinate at a time. Note the crossover - y pairs with a, and x pairs with b. Getting that backwards is the single most common way to blow this round, and it still produces a plausible-looking number.",
    board: <Board />,
    math: ["y  =  λ·a  =  2λ", "x  =  λ·b  =  3λ"],
  },
  {
    term: "Substitute into the constraint",
    body:
      "Now there's one unknown left and exactly one equation not yet used - the constraint itself. Put both expressions in and λ falls out immediately.",
    board: <Board />,
    math: ["2(3λ) + 3(2λ)  =  12", "6λ + 6λ        =  12", "12λ = 12   →   λ = 1"],
  },
  {
    term: "Back out x* and type it",
    body: "λ was only scaffolding - feed it back into x = λb and that's the answer. I always compute y* too, because it makes the sanity check free.",
    board: <Board typed="3" />,
    math: ["x*  =  λ·b  =  1 · 3  =  3", "y*  =  λ·a  =  1 · 2  =  2", "check: 2(3) + 3(2)  =  12  ✓"],
    note: "If the constraint doesn't come back out to k, you've made an arithmetic slip - catch it before submitting.",
  },
  {
    term: "The reveal, and the shortcut",
    body:
      "The reveal confirms λ, x*, y* and the maximum value. And because the objective is always xy in this game, λ has a closed form you can derive once and then reuse to move fast for the rest of the session.",
    board: <Board typed="3" reveal />,
    math: ["λ   =  k / (2ab)", "x*  =  k / (2a)        y*  =  k / (2b)", "here:  x* = 12 / (2·2)  =  3  ✓"],
    note: "Interviewers don't mind you knowing the shortcut - they mind you not being able to derive it on request.",
  },
];
