"use client";

import type { DemoStep } from "../CalcWalkthrough";

// A played round of Taylor Slider: order-3 approximation of e^x at x = 0.5.
// Verified against calcMath's taylorApprox/taylorError —
//   terms 1, 0.5, 0.125, 0.020833 → sum 1.645833
//   true e^0.5 = 1.648721, error 2.89e-3

// Mirrors the live panel, with the input showing what's been typed so far and
// a running tally of the terms already summed.
function Board({
  typed,
  running,
  reveal,
}: {
  typed?: string;
  running?: { k: number; value: string }[];
  reveal?: boolean;
}) {
  return (
    <div className="calc-taylor-panel">
      <p className="calc-taylor-target">
        Compute the order-<strong>3</strong> Taylor approximation of <strong>e^x</strong> at x = 0.5
      </p>
      <p className="mm-step-hint" style={{ marginBottom: 10 }}>
        Σ (term k, k = 0…3) - for e^x, term k is the k-th derivative&apos;s contribution at x = 0.5.
      </p>

      {running && running.length > 0 && (
        <div className="calc-demo-terms">
          {running.map((t) => (
            <span key={t.k} className="calc-demo-term">
              <em>k={t.k}</em> {t.value}
            </span>
          ))}
        </div>
      )}

      <div className="quiz-q-input-row">
        <input
          type="text"
          className="quiz-q-input"
          placeholder="type your approximation"
          value={typed ?? ""}
          readOnly
          disabled
        />
      </div>

      {reveal && (
        <p className="quiz-q-explain is-correct" style={{ marginTop: 10 }}>
          ✓ Correct. True value of e^x at x = 0.5 is 1.64872, so this order&apos;s error is 2.89e-3.
        </p>
      )}
    </div>
  );
}

export const TAYLOR_DEMO: DemoStep[] = [
  {
    term: "This is the board",
    body:
      "A function, a point, and an order. You sum the series out to that order and type the number into that box. Nothing updates as you go - there's no slider to nudge until it looks right, so the whole round happens on paper before you touch the input.",
    board: <Board />,
    note: "Order 3 means k = 0, 1, 2, 3 - four terms, not three. That off-by-one is the most common lost round.",
  },
  {
    term: "Write down the term formula first",
    body:
      "Before computing anything I fix which series I'm in. For e^x every term is just a power of x over a factorial - no derivatives to take once you know that. This is the step people skip, and it's why they add the wrong terms.",
    board: <Board />,
    math: ["e^x  =  Σ  x^k / k!", "term k  =  x^k / k!"],
  },
  {
    term: "Compute k = 0 and k = 1",
    body: "Substitute x = 0.5 and walk k upward. The first two are nearly free, which is worth doing in your head to build the running total early.",
    board: <Board running={[{ k: 0, value: "1" }, { k: 1, value: "0.5" }]} />,
    math: ["k=0:   0.5^0 / 0!  =  1 / 1    =  1", "k=1:   0.5^1 / 1!  =  0.5 / 1  =  0.5", "running total  =  1.5"],
  },
  {
    term: "Compute k = 2 and k = 3",
    body:
      "These are the two that actually need care - squaring and cubing a decimal, then dividing by 2 and 6. Notice how fast the terms shrink: that shrinking is the whole reason a low order is usually enough.",
    board: <Board running={[{ k: 0, value: "1" }, { k: 1, value: "0.5" }, { k: 2, value: "0.125" }, { k: 3, value: "0.020833" }]} />,
    math: [
      "k=2:   0.5^2 / 2!  =  0.25 / 2   =  0.125",
      "k=3:   0.5^3 / 3!  =  0.125 / 6  =  0.020833",
      "running total  =  1.645833",
    ],
  },
  {
    term: "Type the total and check",
    body: "The sum of the four terms goes straight into the box. I don't round hard - a few decimals is plenty, since checking allows a small tolerance.",
    board: <Board typed="1.645833" running={[{ k: 0, value: "1" }, { k: 1, value: "0.5" }, { k: 2, value: "0.125" }, { k: 3, value: "0.020833" }]} />,
    math: ["1 + 0.5 + 0.125 + 0.020833  =  1.645833"],
    note: "1.6458, 1.646 and even 1.65 all pass - the tolerance is about a hundredth.",
  },
  {
    term: "Read the reveal, not just the tick",
    body:
      "The interesting part isn't whether you were right - it's the error line. Order 3 got within 3 thousandths here because x = 0.5 is close to 0. Push x out toward 2 and the same order is far worse; that relationship is what the game is actually drilling.",
    board: <Board typed="1.645833" reveal />,
    math: ["true e^0.5     =  1.648721", "your order-3   =  1.645833", "error          =  2.89e-3"],
  },
  {
    term: "The other three functions",
    body:
      "Same procedure, different term formula - and two of them skip half their terms, which is where most lost rounds go. Check which function you're in before you start summing.",
    board: <Board />,
    math: [
      "sin(x)    term k = ±x^k / k!   (odd k only)",
      "cos(x)    term k = ±x^k / k!   (even k only)",
      "ln(1+x)   term k = ±x^k / k    (k ≥ 1, no factorial)",
    ],
    note: "For sin every even term is 0. For ln(1 + x) there's no k = 0 term at all, and you divide by k - not k factorial.",
  },
];
