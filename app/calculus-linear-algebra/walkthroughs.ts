// One worked example per Gradient Lab game, shown before the first round.
//
// These are deliberately NOT abstract definitions of the topic. Each guide
// walks a single concrete problem end to end with real numbers, the way a
// quant prep book works an example before turning you loose on the drills —
// because the thing that makes a player bounce off these games isn't not
// knowing what an eigenvector is, it's not knowing what the round is asking
// them to type.
//
// Every number below is computed by hand and checked against the same
// functions the games use (calcMath.ts), so a guide can't quietly drift out
// of sync with the mechanic it's explaining.

export type GuideStep = {
  /** Short heading for the step. */
  term: string;
  body: string;
  /** Monospace computation lines — rendered pre-formatted, so alignment matters. */
  math?: string[];
  /** Small aside under the step: the trap, the sanity check, the shortcut. */
  note?: string;
};

export type Guide = {
  /** The concrete problem this guide works, shown under the title. */
  premise: string;
  steps: GuideStep[];
};

export const TAYLOR_GUIDE: Guide = {
  premise: "Worked example — the order-3 Taylor approximation of eˣ at x = 0.5",
  steps: [
    {
      term: "What the round asks",
      body:
        "Every round names a function, a point x, and an order. You sum the series out to that order and type the number. Nothing updates live — you compute it first, then find out whether you were right.",
      math: ["Compute the order-3 Taylor", "approximation of  e^x  at  x = 0.5"],
      note: "Order 3 means terms k = 0, 1, 2, 3 — that's four terms, not three.",
    },
    {
      term: "The series you need",
      body:
        "A Taylor series around 0 rewrites the function as a sum of powers of x. For e^x the k-th term is just x to the k over k factorial — once you know that, there are no derivatives left to take.",
      math: ["e^x  =  Σ  x^k / k!", "term k  =  x^k / k!"],
    },
    {
      term: "Work it term by term",
      body: "Substitute x = 0.5 and run k from 0 up to 3. Each term is one power over one factorial.",
      math: [
        "k=0:   0.5^0 / 0!  =  1 / 1      =  1",
        "k=1:   0.5^1 / 1!  =  0.5 / 1    =  0.5",
        "k=2:   0.5^2 / 2!  =  0.25 / 2   =  0.125",
        "k=3:   0.5^3 / 3!  =  0.125 / 6  =  0.020833",
      ],
    },
    {
      term: "Add them up",
      body: "The sum of those four terms is the number you type. That's the whole task.",
      math: ["1 + 0.5 + 0.125 + 0.020833", "     =  1.645833"],
      note: "Checking is tolerant to about a hundredth — 1.6458, 1.646 and 1.65 all pass.",
    },
    {
      term: "What the reveal adds",
      body:
        "After you check, you see the true value, the error at your order, and the smallest order that would have cleared the round's error target. That gap is the real lesson: convergence speed depends on how far x sits from 0.",
      math: ["true e^0.5     =  1.648721", "your order-3   =  1.645833", "error          =  2.89e-3"],
    },
    {
      term: "The other three functions",
      body:
        "Same procedure, different term formula. Two of them skip half their terms outright, which is where most lost rounds actually go.",
      math: [
        "sin(x)    term k = ±x^k / k!   (odd k only)",
        "cos(x)    term k = ±x^k / k!   (even k only)",
        "ln(1+x)   term k = ±x^k / k    (k ≥ 1, no factorial)",
      ],
      note:
        "For sin every even term is 0. For ln(1 + x) there is no k = 0 term at all, and you divide by k — not by k factorial.",
    },
  ],
};

export const LAGRANGE_GUIDE: Guide = {
  premise: "Worked example — maximize xy subject to 2x + 3y = 12",
  steps: [
    {
      term: "What the round asks",
      body:
        "Each round hands you the same objective, f(x, y) = xy, and a fresh budget line ax + by = k. You return x* — the x-coordinate of the constrained maximum.",
      math: ["maximize    f(x, y) = xy", "subject to  2x + 3y = 12,   x, y ≥ 0"],
    },
    {
      term: "The Lagrange condition",
      body:
        "At a constrained optimum the objective's gradient is parallel to the constraint's gradient — not equal, parallel, with λ as the scale factor. That one equation is the entire method.",
      math: ["∇f  =  λ ∇g", "∇f  =  (y, x)", "∇g  =  (a, b)  =  (2, 3)"],
      note: "Geometrically: the level curve of xy is tangent to the budget line exactly at the optimum.",
    },
    {
      term: "Split it into components",
      body:
        "Read the vector equation one coordinate at a time and you get two scalar equations — with both x and y now written in terms of the single unknown λ.",
      math: ["y  =  λ·a  =  2λ", "x  =  λ·b  =  3λ"],
    },
    {
      term: "Substitute into the constraint",
      body: "One unknown left, and one equation you haven't used yet — the constraint itself. Put both expressions in and solve.",
      math: ["2(3λ) + 3(2λ)  =  12", "6λ + 6λ        =  12", "12λ = 12   →   λ = 1"],
    },
    {
      term: "Back out x*",
      body: "λ was only ever scaffolding. Feed it back into x = λb and you have the number to type.",
      math: ["x*  =  λ·b  =  1 · 3  =  3", "y*  =  λ·a  =  1 · 2  =  2"],
      note: "Sanity check: 2(3) + 3(2) = 12 ✓ — and the maximum value of xy is 6.",
    },
    {
      term: "The shortcut worth keeping",
      body:
        "Because the objective is always xy here, λ collapses to a closed form every round. Interviewers rarely mind you knowing it — they mind you not being able to derive it.",
      math: ["λ   =  k / (2ab)", "x*  =  k / (2a)        y*  =  k / (2b)"],
      note: "On this round: 12 / (2·2) = 3 ✓. Derive it once, then use it to move fast.",
    },
  ],
};

export const EIGEN_GUIDE: Guide = {
  premise: "Worked example — which direction survives A = [[3, 1], [0, 2]]?",
  steps: [
    {
      term: "What the round asks",
      body:
        "Four directions are drawn on the plot. Applying A swings three of them off their own line and merely stretches or flips the fourth. Click that one.",
      math: ["A  =  [  3   1  ]", "      [  0   2  ]"],
    },
    {
      term: "The definition, operationally",
      body:
        "v is an eigenvector of A when Av lands back on the same line through the origin as v — that is, Av is just v times some number. The length can change, the sign can flip; the direction cannot.",
      math: ["A v  =  λ v"],
      note: "λ is the eigenvalue. You never need its value to answer this game — only whether one exists.",
    },
    {
      term: "The test that avoids division",
      body:
        "Comparing Av to v component by component means dividing, which falls apart the moment a component is 0. The cross-product test never does: two 2-D vectors are parallel exactly when this comes out zero.",
      math: ["v = (x, y),   A v = (p, q)", "parallel   ⟺   p·y − q·x  =  0"],
    },
    {
      term: "Try a decoy",
      body: "Take v = (1, 1). Multiply it out, then run the test.",
      math: ["A·(1,1)  =  (3·1 + 1·1,  0·1 + 2·1)", "         =  (4, 2)", "cross  =  4·1 − 2·1  =  2   ≠ 0"],
      note: "Nonzero, so (4, 2) points somewhere (1, 1) doesn't. It rotated — not an eigenvector.",
    },
    {
      term: "Try the real one",
      body: "Now v = (1, 0). Same two lines of work.",
      math: ["A·(1,0)  =  (3·1 + 1·0,  0·1 + 2·0)", "         =  (3, 0)", "cross  =  3·0 − 0·1  =  0   ✓"],
      note: "Zero — and (3, 0) is exactly 3·(1, 0). Same line, stretched by λ = 3. That's the click.",
    },
    {
      term: "How to move fast",
      body:
        "The plot narrows it before you compute anything: any arrow that visibly swings into a new quadrant is out. Rank the four by eye, then run the cross-product test on your best guess first.",
      note: "In an interview the follow-up is always \"and the eigenvalue?\" — read it off the stretch factor, 3 here.",
    },
  ],
};

export const PSD_GUIDE: Guide = {
  premise: "Worked example — classify Σ = [[4, 1], [1, 3]]",
  steps: [
    {
      term: "What the round asks",
      body:
        "You get a symmetric 2×2 matrix and four labels. The real question underneath is whether xᵀΣx can ever go negative — which is exactly the test for whether something could be a genuine covariance matrix.",
      math: ["Σ  =  [ a  b ]    =    [ 4  1 ]", "      [ b  c ]         [ 1  3 ]"],
    },
    {
      term: "Two numbers decide it",
      body:
        "You never need the eigenvalues themselves — only their sum and their product, and both read straight off the matrix with one addition and one subtraction.",
      math: ["trace  =  a + c    =  λ₁ + λ₂", "det    =  ac − b²  =  λ₁ · λ₂"],
    },
    {
      term: "The decision rule",
      body:
        "Determinant first — its sign tells you whether the two eigenvalues agree. Then the trace tells you which sign they agree on.",
      math: [
        "det < 0              →   Indefinite",
        "det > 0,  trace > 0  →   Positive definite",
        "det = 0,  trace > 0  →   Positive semidefinite",
        "det ≥ 0,  trace < 0  →   Negative definite",
      ],
      note: "det = 0 is the semidefinite boundary — it means one eigenvalue is exactly zero.",
    },
    {
      term: "Work the example",
      body: "Both numbers fall out immediately.",
      math: ["trace  =  4 + 3        =  7", "det    =  4·3 − 1²     =  11", "det > 0  and  trace > 0"],
      note: "Positive definite — both eigenvalues are strictly positive.",
    },
    {
      term: "The trap",
      body:
        "A positive diagonal is not enough, and this is the case that catches people. A big off-diagonal drags the determinant negative no matter how healthy a and c look.",
      math: ["Σ  =  [ 1  3 ]", "      [ 3  1 ]", "trace  =  2        (positive)", "det    =  1 − 9  =  −8   (negative)"],
      note: "Indefinite. In covariance terms it's claiming a correlation above 1, which no real data can produce.",
    },
    {
      term: "Why interviews ask this",
      body:
        "Every covariance matrix is positive semidefinite, so \"is this a valid covariance matrix?\" and \"is this PSD?\" are the same question. It's also the condition that makes a quadratic objective convex — which is why it turns up in every portfolio optimisation problem.",
    },
  ],
};

export const NEWTON_GUIDE: Guide = {
  premise: "Worked example — solving x² − 9 = 0 from x₀ = 1",
  steps: [
    {
      term: "What the round asks",
      body:
        "You predict how many Newton iterations it takes to land within 1e-4 of the true root — before you see a single step. Then the table runs and you're scored on how close the guess was.",
      math: ["solve    x² − 9 = 0", "from     x₀ = 1", "until    |xₙ − root| ≤ 1e-4"],
      note: "Exact is 3 points, off by one is 2, off by two is 1.",
    },
    {
      term: "The update rule",
      body:
        "Newton replaces the curve with its tangent line at your current point and jumps to where that line crosses zero. For x² − a the whole thing collapses into an average you can do in your head.",
      math: ["xₙ₊₁  =  xₙ − f(xₙ)/f'(xₙ)", "      =  xₙ − (xₙ² − a)/(2xₙ)", "      =  ( xₙ + a/xₙ ) / 2"],
      note: "That last form is the ancient Babylonian square-root method — Newton's method rediscovers it.",
    },
    {
      term: "The first steps are the sloppy ones",
      body:
        "Starting at x₀ = 1 when the root is near 3 is a poor guess, so the first jump overshoots badly. Far from the root, Newton is barely better than bisection.",
      math: ["x₁ = (1 + 9/1)/2  =  5        err  2.0e+0", "x₂ = (5 + 9/5)/2  =  3.4      err  4.0e-1"],
    },
    {
      term: "Then it doubles its digits",
      body:
        "Once you're close, convergence is quadratic — each step roughly squares the error, so the count of correct digits doubles. This is why the answer is never a big number.",
      math: ["x₃  =  3.023529     err  2.4e-2", "x₄  =  3.000092     err  9.2e-5   ✓"],
      note: "Answer: 4 iterations. Watch the error go 4e-1 → 2e-2 → 9e-5 — squaring every step.",
    },
    {
      term: "How to guess without computing",
      body:
        "A larger a means a root further from x₀ = 1, which costs one extra sloppy step up front. Across this game's whole range that produces only three possible answers.",
      math: ["a = 3          →   3 iterations", "a = 4 … 9      →   4 iterations", "a = 10 … 20    →   5 iterations"],
      note: "So the read is really just \"is a below 10 or not\" — and even a blind 5 is never worse than two off.",
    },
  ],
};
