"use client";

import { useState } from "react";

type Chapter = {
  title: string;
  pages: string;
  goal: string;
  topics: string[];
  whatInterviewersTest: string[];
  practice: {
    prompt: string;
    hint: string;
    answerFrame: string;
  }[];
};

const chapters: Chapter[] = [
  {
    title: "Chapter 1 - General Principles",
    pages: "Starts around p. 1",
    goal: "Build a repeatable interview process: listen carefully, make reasonable assumptions, simplify the problem, and speak your reasoning out loud.",
    topics: [
      "Build a broad knowledge base",
      "Practice interview communication",
      "Listen carefully before solving",
      "State assumptions",
      "Keep your reasoning visible",
    ],
    whatInterviewersTest: [
      "Can you turn an unclear prompt into a clean model?",
      "Can you recover when you choose a poor first path?",
      "Can you communicate without hiding the important reasoning?",
    ],
    practice: [
      {
        prompt: "An interviewer gives an underspecified pricing puzzle. What do you say before doing math?",
        hint: "Define the random object, payoff, assumptions, and target output.",
        answerFrame: "Restate the goal, name assumptions, choose a simple model, solve, then sanity-check against edge cases.",
      },
      {
        prompt: "You notice halfway through that your first assumption was too strong. How should you handle it?",
        hint: "Do not bury the correction.",
        answerFrame: "Say what changed, explain why the original route fails, then restart from the smallest corrected setup.",
      },
    ],
  },
  {
    title: "Chapter 2 - Brain Teasers",
    pages: "Starts around p. 3",
    goal: "Practice invariants, symmetry, contradiction, induction, modular arithmetic, and clean case reduction.",
    topics: [
      "Problem simplification",
      "Logic reasoning",
      "Thinking outside the obvious frame",
      "Symmetry",
      "Series summation",
      "Pigeonhole principle",
      "Modular arithmetic",
      "Math induction",
      "Proof by contradiction",
    ],
    whatInterviewersTest: [
      "Can you find the invariant instead of brute-forcing cases?",
      "Can you compress a puzzle into a state transition?",
      "Can you prove impossibility cleanly?",
    ],
    practice: [
      {
        prompt: "A puzzle has many people changing seats or states. What is your first move?",
        hint: "Look for a quantity that is preserved.",
        answerFrame: "Define state variables, identify what changes each step, identify what never changes, then use that invariant to rule outcomes in or out.",
      },
      {
        prompt: "A problem asks for a guarantee after many choices. Which principle is likely involved?",
        hint: "Guarantees often mean boxes and objects.",
        answerFrame: "Use the pigeonhole principle: if n + 1 objects are placed into n categories, at least one category contains two objects.",
      },
      {
        prompt: "A hats or colors puzzle seems impossible because everyone lacks information. What tool helps?",
        hint: "Assume the opposite and follow the public information.",
        answerFrame: "Use contradiction or induction over rounds of silence; each round eliminates one class of possible worlds.",
      },
    ],
  },
  {
    title: "Chapter 3 - Calculus and Linear Algebra",
    pages: "Starts around p. 33",
    goal: "Refresh the mathematical toolkit behind quant models: derivatives, integration, approximation, optimization, differential equations, and matrix structure.",
    topics: [
      "Limits and derivatives",
      "Integration and expected value by integration",
      "Partial derivatives and multiple integrals",
      "Taylor series",
      "Newton's method",
      "Lagrange multipliers",
      "Ordinary differential equations",
      "Vectors and decompositions",
      "Eigenvalues, eigenvectors, and positive definiteness",
      "LU, QR, and Cholesky decompositions",
    ],
    whatInterviewersTest: [
      "Can you approximate quickly and state the error term?",
      "Can you optimize under constraints?",
      "Can you recognize when a matrix property matters for stability or covariance?",
    ],
    practice: [
      {
        prompt: "How do you approximate f(x + h) when h is small?",
        hint: "Start with the first derivative; add curvature if needed.",
        answerFrame: "Use Taylor expansion: f(x + h) is about f(x) + h f'(x), with second-order correction 0.5 h^2 f''(x).",
      },
      {
        prompt: "How do you maximize a function subject to one smooth constraint?",
        hint: "At the optimum, the level curve is tangent to the constraint.",
        answerFrame: "Use Lagrange multipliers: solve gradient f = lambda gradient g along with g(x) = 0.",
      },
      {
        prompt: "Why does positive semidefinite matter for a covariance matrix?",
        hint: "Variance of every portfolio must be nonnegative.",
        answerFrame: "For every vector w, w' Sigma w is a variance, so it must be at least zero. That is the PSD condition.",
      },
    ],
  },
  {
    title: "Chapter 4 - Probability Theory",
    pages: "Starts around p. 59",
    goal: "Master the interview core: counting, conditioning, Bayes, distributions, expectations, variance, covariance, and order statistics.",
    topics: [
      "Basic probability definitions",
      "Set operations",
      "Combinatorial analysis",
      "Conditional probability",
      "Bayes' formula",
      "Discrete and continuous distributions",
      "Expected value, variance, and covariance",
      "Order statistics",
    ],
    whatInterviewersTest: [
      "Can you define the sample space before calculating?",
      "Can you condition on the information actually observed?",
      "Can you use linearity of expectation even when variables are dependent?",
    ],
    practice: [
      {
        prompt: "A conditional probability question says a family has at least one boy. What is the danger?",
        hint: "The observation process matters.",
        answerFrame: "Define exactly how the information was sampled. Different observation mechanisms create different conditional spaces.",
      },
      {
        prompt: "A rare event test is 99 percent accurate. Why can a positive result still be unreliable?",
        hint: "Base rate can dominate the posterior.",
        answerFrame: "Use Bayes: posterior = sensitivity times prevalence divided by total positive probability, including false positives.",
      },
      {
        prompt: "You need the expected number of collected coupon types after n draws.",
        hint: "Indicators are easier than waiting times.",
        answerFrame: "Let I_i indicate coupon i appeared. Sum E[I_i] over coupon types; linearity avoids dependence problems.",
      },
      {
        prompt: "What is the expected maximum of independent draws?",
        hint: "Work with the CDF of the maximum.",
        answerFrame: "If M = max(X_1,...,X_n), then P(M <= x) = F(x)^n. Differentiate for density or integrate tail probabilities.",
      },
    ],
  },
  {
    title: "Chapter 5 - Stochastic Process and Stochastic Calculus",
    pages: "Starts around p. 105",
    goal: "Turn random evolution into states, recursions, stopping rules, martingales, Brownian motion, and Ito-style reasoning.",
    topics: [
      "Markov chains",
      "Gambler's ruin",
      "Random walks",
      "Martingales",
      "Dynamic programming",
      "Brownian motion",
      "Stopping time and first passage time",
      "Ito's lemma",
    ],
    whatInterviewersTest: [
      "Can you choose a state that makes the future depend only on the present?",
      "Can you write a one-step recursion?",
      "Can you separate drift, volatility, and optional stopping intuition?",
    ],
    practice: [
      {
        prompt: "A game moves between states until it reaches a boundary. How do you set up expected time to absorption?",
        hint: "One equation per non-absorbing state.",
        answerFrame: "Let T_i be expected remaining time from state i. Then T_i = 1 + sum p_ij T_j, with T = 0 at absorbing states.",
      },
      {
        prompt: "Why are martingales useful in pricing?",
        hint: "Fair games have no predictable drift under the right measure.",
        answerFrame: "Under a risk-neutral measure, discounted tradable prices behave like martingales, so current value equals expected discounted payoff.",
      },
      {
        prompt: "What does Ito's lemma add beyond ordinary calculus?",
        hint: "Brownian motion has a nonzero quadratic variation term.",
        answerFrame: "For diffusion inputs, the second derivative term contributes because (dW)^2 behaves like dt.",
      },
    ],
  },
  {
    title: "Chapter 6 - Finance",
    pages: "Starts around p. 137",
    goal: "Use no-arbitrage thinking to reason about option prices, Greeks, portfolios, exotics, risk, bonds, forwards, futures, and rates.",
    topics: [
      "Option price direction",
      "Put-call parity",
      "American versus European options",
      "Black-Scholes-Merton PDE",
      "Black-Scholes formula",
      "Delta, gamma, theta, and vega",
      "Bull spreads, straddles, binary options, and exchange options",
      "Portfolio optimization",
      "Value at Risk",
      "Duration and convexity",
      "Forwards, futures, and interest-rate models",
    ],
    whatInterviewersTest: [
      "Can you reason from replication instead of memorizing?",
      "Can you explain Greeks in words and signs?",
      "Can you connect risk measures to distribution assumptions?",
    ],
    practice: [
      {
        prompt: "Explain put-call parity without starting from the formula.",
        hint: "Compare two portfolios with identical terminal payoffs.",
        answerFrame: "Long call plus present value of strike matches long put plus stock at expiration, so no-arbitrage requires equal prices today.",
      },
      {
        prompt: "What is delta in interview language?",
        hint: "It is both a derivative and a hedge ratio.",
        answerFrame: "Delta is sensitivity of option value to the underlying price and the number of shares needed for first-order hedging.",
      },
      {
        prompt: "Why does convexity make bond price response asymmetric?",
        hint: "Duration is first-order; convexity is second-order.",
        answerFrame: "Price change is approximated by duration times rate move plus a convexity correction, so gains and losses are not symmetric for equal rate moves.",
      },
    ],
  },
  {
    title: "Chapter 7 - Algorithms and Numerical Methods",
    pages: "Starts around p. 171",
    goal: "Prepare for quant developer and numerical questions: complexity, arrays, randomization, Monte Carlo, and finite differences.",
    topics: [
      "Number swap",
      "Unique elements",
      "Horner's algorithm",
      "Moving average",
      "Sorting and searching",
      "Random permutation",
      "Fibonacci numbers",
      "Maximum contiguous subarray",
      "Power-of-two tricks",
      "Monte Carlo simulation",
      "Finite difference methods",
    ],
    whatInterviewersTest: [
      "Can you write the simple correct algorithm first?",
      "Can you analyze runtime and memory?",
      "Can you discuss simulation error and numerical stability?",
    ],
    practice: [
      {
        prompt: "How do you generate a uniform random permutation?",
        hint: "Swap progressively with a random remaining index.",
        answerFrame: "Use Fisher-Yates: for i from n - 1 down to 1, choose j uniformly from 0..i and swap.",
      },
      {
        prompt: "What is the core idea of maximum contiguous subarray?",
        hint: "Keep the best ending here.",
        answerFrame: "Kadane's algorithm updates current = max(x, current + x) and best = max(best, current) in one pass.",
      },
      {
        prompt: "How should you describe Monte Carlo accuracy?",
        hint: "Error shrinks slowly.",
        answerFrame: "Independent-path standard error is estimated as sample standard deviation divided by sqrt(n); quadrupling paths roughly halves error.",
      },
    ],
  },
];

const flowerOfLifePoints: [number, number][] = (() => {
  const dirs = Array.from({ length: 6 }, (_, k) => {
    const angle = (Math.PI / 3) * k;
    return [Math.cos(angle), Math.sin(angle)] as [number, number];
  });
  const points: [number, number][] = [[0, 0]];
  dirs.forEach(([x, y]) => points.push([x, y]));
  dirs.forEach(([x, y]) => points.push([x * 2, y * 2]));
  dirs.forEach(([x, y], k) => {
    const [nx, ny] = dirs[(k + 1) % 6];
    points.push([x + nx, y + ny]);
  });
  return points;
})();

type BrainTeaser = {
  category: string;
  prompt: string;
  approach: string;
  resolution: string;
};

const brainTeasers: BrainTeaser[] = [
  {
    category: "Invariants",
    prompt:
      "Several ants walk at the same constant speed along a finite straight stick, each moving left or right. Whenever two ants collide, both instantly reverse direction. How would you find the time until the last ant falls off, without tracking any single ant's path?",
    approach:
      "A collision-and-reverse between two identical ants looks exactly like the two ants passing through each other and swapping labels.",
    resolution:
      "Replace every collision with a pass-through. The set of paths is now just ants walking straight to an edge, so the last ant off is whichever original ant had the longest straight-line distance to travel.",
  },
  {
    category: "Symmetry",
    prompt:
      "You flip a fair coin repeatedly and stop the first time you see HH or the first time you see HT. Without computing either expectation directly, argue why the average wait for HH is longer than for HT.",
    approach:
      "Compare what happens right after the first heads. HT only needs one more flip to finish; HH can be knocked back to needing two heads again by an intervening tail.",
    resolution:
      "After the first H, HT succeeds on the very next flip regardless of outcome-ish reasoning, while HH restarts its clock whenever a T appears. That asymmetry in how failures are punished makes HH's expected wait longer, even though both patterns have equal probability on any single pair of flips.",
  },
  {
    category: "Pigeonhole",
    prompt:
      "Show that at any gathering of 6 people, you can always find 3 people who all know each other or 3 people who are all mutual strangers.",
    approach:
      "Fix one person and sort the other 5 by whether they know that person or not.",
    resolution:
      "By pigeonhole, that person has at least 3 acquaintances or at least 3 strangers among the other 5. Look inside whichever group of 3 exists: if any two of them know each other, they plus the fixed person form a matching triangle; if none do, those 3 are mutual strangers. Either way the claim holds.",
  },
  {
    category: "Modular Arithmetic",
    prompt:
      "A vending machine only accepts exact change using 3-cent and 5-cent tokens. Argue which amounts above a certain threshold can always be made exactly, using a modular argument instead of checking every case.",
    approach:
      "Once you can make k, k+1, ..., k+2 consecutive amounts, adding a 3-cent token reaches every later amount, so you only need to clear a short run of residues.",
    resolution:
      "Check amounts 8, 9, 10: 8 = 3+5, 9 = 3+3+3, 10 = 5+5. That is 3 consecutive integers, and adding threes shifts each one forward by 3 forever, covering every residue class mod 3 from that point on. So every amount from 8 cents upward is achievable; the only failures are below that run.",
  },
  {
    category: "Induction",
    prompt:
      "A chessboard of size 2^n by 2^n has exactly one square removed, anywhere on the board. Explain how to tile the rest with L-shaped trominoes (3-square pieces).",
    approach:
      "Base case n = 1 is a 2x2 board minus one square, which is exactly one L-tromino. For the inductive step, quarter the board.",
    resolution:
      "Split the 2^n board into four 2^(n-1) quadrants. The missing square sits in one quadrant, which is tileable by the inductive hypothesis. Place one L-tromino at the center covering one cell from each of the other three quadrants; that turns each of them into a smaller board with one square missing, so all four quadrants are now tileable by induction.",
  },
  {
    category: "Contradiction",
    prompt:
      "Give an interview-length proof that there is no largest prime number.",
    approach:
      "Assume a largest prime exists and build a number that forces a contradiction.",
    resolution:
      "Suppose p is the largest prime. Let N = (product of every prime up to p) + 1. N is not divisible by any prime up to p, since each leaves remainder 1. So N is either prime itself or divisible by a prime larger than p. Both cases produce a prime bigger than p, contradicting that p was the largest.",
  },
  {
    category: "Case Reduction",
    prompt:
      "You have two ropes, each of which takes exactly 60 minutes to burn end to end, but each burns unevenly along its length. Using only matches, measure exactly 45 minutes.",
    approach:
      "Uneven burning ruins any argument based on length, so only argue about the two ends of a rope burning simultaneously in 30 minutes.",
    resolution:
      "Light rope A at both ends and rope B at one end simultaneously. Rope A finishes in 30 minutes regardless of how unevenly it burns. At that moment, light the other end of rope B too; the remaining unburned portion of B, now burning from both ends, finishes in half of whatever time was left, which is 15 more minutes. Total: 30 + 15 = 45.",
  },
  {
    category: "Series Summation",
    prompt:
      "Without recalling the closed-form formula, explain why the sum of the first n odd numbers equals n^2.",
    approach:
      "Picture growing a square one L-shaped layer at a time.",
    resolution:
      "An n by n square of dots can be built by starting with a single dot, then wrapping it with an L-shaped border of 3 dots to get a 2x2 square, then a border of 5 dots to get 3x3, and so on. Each new border adds the next odd number, and after n borders the square is n by n, so the first n odd numbers sum to n^2.",
  },
  {
    category: "Search Strategy",
    prompt:
      "You have 12 coins, identical in appearance. Exactly one is counterfeit and weighs differently from the rest, but you do not know if it is heavier or lighter. Using a balance scale only 3 times, describe how you would find it.",
    approach:
      "Each weighing has 3 outcomes, so 3 weighings can distinguish at most 3^3 = 27 possibilities. With 12 coins that could each be heavy or light, plus the all-genuine case, you are within budget only if every weighing is designed to be maximally informative.",
    resolution:
      "Split coins into three groups of 4 and weigh two groups against each other. A balanced result isolates the fault to the untouched group; an imbalance isolates it to one pan while also revealing a heavy/light hypothesis for each coin in it. Carry that partial information into the second weighing, mixing known-genuine coins in to keep every outcome informative, and the third weighing pins down the exact coin and direction.",
  },
];

const weeklyPlan = [
  "Week 1: Read the general principles and do one spoken solution per day.",
  "Week 2: Work brain teasers by method: invariants, symmetry, contradiction, induction.",
  "Week 3: Refresh calculus and linear algebra; make a one-page formula sheet.",
  "Week 4: Drill probability daily, especially conditioning and expectation.",
  "Week 5: Build Markov chain and dynamic programming recursions from scratch.",
  "Week 6: Practice finance questions using replication and no-arbitrage first.",
  "Week 7: Code algorithms and numerical methods with runtime notes.",
  "Week 8: Mix topics under a timer and explain every solution aloud.",
];

const answerChecklist = [
  "Restate the target in one sentence.",
  "Declare assumptions and notation.",
  "Choose the smallest useful model.",
  "Solve with visible intermediate reasoning.",
  "Check edge cases, signs, units, and limiting cases.",
  "Summarize the result in interview language.",
];

const teaserCategories = Array.from(new Set(brainTeasers.map((teaser) => teaser.category)));

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [flippedTeasers, setFlippedTeasers] = useState<Set<number>>(new Set());
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightRevealed, setSpotlightRevealed] = useState(false);

  const startLab = () => setHasStarted(true);

  const toggleTeaser = (index: number) => {
    setFlippedTeasers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const shuffleSpotlight = () => {
    setSpotlightRevealed(false);
    setSpotlightIndex((prev) => {
      if (brainTeasers.length <= 1) return prev;
      let next = Math.floor(Math.random() * brainTeasers.length);
      while (next === prev) {
        next = Math.floor(Math.random() * brainTeasers.length);
      }
      return next;
    });
  };

  const spotlightTeaser = brainTeasers[spotlightIndex];
  const filteredTeasers = brainTeasers
    .map((teaser, index) => ({ teaser, index }))
    .filter(({ teaser }) => activeCategory === "All" || teaser.category === activeCategory);

  return (
    <>
      {!hasStarted && (
        <div
          className="intro-screen"
          role="button"
          tabIndex={0}
          aria-label="Enter Quant Interview Prep Lab"
          onClick={startLab}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              startLab();
            }
          }}
        >
          <div className="intro-content">
            <h1>Quant Interview Prep Lab</h1>
            <div className="badge-scene" aria-hidden="true">
              <div className="flower-of-life-3d">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle className="fol-bound" cx={50} cy={50} r={49} />
                  {flowerOfLifePoints.map(([x, y], index) => (
                    <circle key={index} cx={50 + x * 16} cy={50 + y * 16} r={16} />
                  ))}
                  <circle className="fol-core" cx={50} cy={50} r={2} />
                </svg>
              </div>
            </div>
          </div>
          <p className="hint-bubble">Click anywhere to start</p>
        </div>
      )}

      <main className={hasStarted ? "study-site is-visible" : "study-site"} aria-hidden={!hasStarted}>
      <header className="hero">
        <p className="label">Built from the attached book's topic structure</p>
        <h1>Quant Interview Prep Lab</h1>
        <p>
          A content-first guide based on <em>A Practical Guide to Quantitative Finance Interviews</em>.
          It summarizes the book's organization, turns each chapter into a study checklist,
          and adds original practice prompts with answer frameworks.
        </p>
        <p className="note">
          This site uses the book as source material for study structure only. It does not reproduce
          the book's protected problem solutions or long passages.
        </p>
      </header>

      <section className="section">
        <h2>How to Use This Site</h2>
        <ol className="steps">
          {answerChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>8-Week Prep Schedule</h2>
        <div className="grid two">
          {weeklyPlan.map((week) => (
            <article className="card" key={week}>
              <p>{week}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section teaser-arena">
        <h2>Brain Teasers Arena</h2>
        <p className="section-intro">
          Original teasers written in the spirit of Chapter 2, sorted by the reasoning tool that cracks them.
          Flip a card to check your approach.
        </p>

        <a href="/brain-teasers" className="chip-btn teaser-bubble brain-teasers-link">
          Open the Brain Teasers Lab →
        </a>

        <div className="teaser-spotlight">
          <div className="teaser-spotlight-head">
            <p className="label">Spotlight // {spotlightTeaser.category}</p>
            <button type="button" className="shuffle-btn" onClick={shuffleSpotlight}>
              Shuffle
            </button>
          </div>
          <p className="teaser-spotlight-prompt">{spotlightTeaser.prompt}</p>
          {spotlightRevealed ? (
            <div className="teaser-spotlight-answer">
              <p>
                <strong>Approach:</strong> {spotlightTeaser.approach}
              </p>
              <p>
                <strong>Resolution:</strong> {spotlightTeaser.resolution}
              </p>
            </div>
          ) : (
            <button type="button" className="reveal-btn" onClick={() => setSpotlightRevealed(true)}>
              Reveal approach
            </button>
          )}
        </div>

        <div className="teaser-filters">
          {["All", ...teaserCategories].map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "chip-btn active" : "chip-btn"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="teaser-grid">
          {filteredTeasers.map(({ teaser, index }) => {
            const isFlipped = flippedTeasers.has(index);
            return (
              <div className="teaser-card-scene" key={teaser.prompt}>
                <button
                  type="button"
                  className={isFlipped ? "teaser-card is-flipped" : "teaser-card"}
                  onClick={() => toggleTeaser(index)}
                  aria-label={isFlipped ? "Flip back to the teaser" : "Flip to reveal the approach"}
                >
                  <div className="teaser-face teaser-front">
                    <p className="label">{teaser.category}</p>
                    <p>{teaser.prompt}</p>
                    <span className="teaser-hint-tag">Tap to flip</span>
                  </div>
                  <div className="teaser-face teaser-back">
                    <p>
                      <strong>Approach:</strong> {teaser.approach}
                    </p>
                    <p>
                      <strong>Resolution:</strong> {teaser.resolution}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>Chapter Study Map</h2>
        <div className="chapter-list">
          {chapters.map((chapter) => (
            <article className="chapter" key={chapter.title}>
              <div className="chapter-heading">
                <div>
                  <p className="label">{chapter.pages}</p>
                  <h3>{chapter.title}</h3>
                </div>
              </div>
              <p>{chapter.goal}</p>

              <h4>Core Topics</h4>
              <ul className="tags">
                {chapter.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>

              <h4>What Interviewers Test</h4>
              <ul>
                {chapter.whatInterviewersTest.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h4>Practice Prompts</h4>
              <div className="practice-list">
                {chapter.practice.map((item) => (
                  <details className="practice" key={item.prompt}>
                    <summary>{item.prompt}</summary>
                    <p><strong>Hint:</strong> {item.hint}</p>
                    <p><strong>Answer frame:</strong> {item.answerFrame}</p>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Fast Reference</h2>
        <div className="grid three">
          <article className="card">
            <h3>Probability</h3>
            <p>Define the sample space. For conditioning, be precise about how information was observed.</p>
            <code>P(A | B) = P(B | A)P(A) / P(B)</code>
          </article>
          <article className="card">
            <h3>Optimization</h3>
            <p>State the objective, constraints, and curvature before doing algebra.</p>
            <code>gradient f = lambda gradient g</code>
          </article>
          <article className="card">
            <h3>No-Arbitrage</h3>
            <p>If two portfolios have the same payoff in every state, their prices must match today.</p>
            <code>C + PV(K) = P + S</code>
          </article>
          <article className="card">
            <h3>Markov Recursion</h3>
            <p>Pick states so the next step depends only on the current state.</p>
            <code>V_i = reward_i + sum p_ij V_j</code>
          </article>
          <article className="card">
            <h3>Monte Carlo</h3>
            <p>Track estimator variance and explain accuracy using standard error.</p>
            <code>standard error = s / sqrt(n)</code>
          </article>
          <article className="card">
            <h3>Communication</h3>
            <p>A strong interview answer is a clean path, not just a final number.</p>
            <code>setup to method to check to result</code>
          </article>
        </div>
      </section>
      </main>
    </>
  );
}
