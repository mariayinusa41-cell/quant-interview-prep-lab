import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import "./audit.css";

export const metadata: Metadata = {
  title: "Readiness Audit - Outcry",
  description: "An honest coverage audit for quant trading, research, and developer interviews.",
};

const coverage = [
  {
    area: "Mental math / estimation",
    score: "84%",
    level: "Strong",
    levelClass: "strong",
    current: "Arithmetic Drill, Fermi Estimation, and Sequence Sprint, plus Fermi's new Technical Estimation mode — 243 verified questions modeled on the actual assessment screens: timed visual dice-counting, grid-path distance, powers/factorials, random walks, market microstructure, and hardware latency.",
    next: "Percentage and fraction speed, logs, quick EV, and trading-specific calibration.",
  },
  {
    area: "Probability",
    score: "76%",
    level: "Strong",
    levelClass: "strong",
    current: "Gambler's ruin, Markov walking, blackjack, lottery odds, Bayes, conditional probability, and classics, plus two new drills: Likelihood Ranking (213 questions — rank students/distributions/dice/urns/Poisson events most-to-least-likely) and Dice EV Lab (7 EV mechanics — reroll games, roll-until-target, max/min of N, bust accumulators, backgammon-flavored cube decisions — effectively unlimited generation).",
    next: "Joint distributions, covariance, conditional expectation, order statistics, and mixed timed sets.",
  },
  {
    area: "Logic / brain teasers",
    score: "75%",
    level: "Strong",
    levelClass: "strong",
    current: "13 playable games covering game theory, induction, parity, counting, and constraint reduction.",
    next: "Pigeonhole, modular arithmetic, symmetry, and more adversarial interviewer follow-ups.",
  },
  {
    area: "Statistics",
    score: "65%",
    level: "Developing",
    levelClass: "developing",
    current: "Crack the Bot now goes past single-predictor t-stats into a real confounder check — closed-form multiple regression, an auxiliary regression, and the omitted-variable-bias identity (naive slope − partial slope ≈ β_control × aux slope), verified against the actual overlapping predictors live. Plus distributions and CLT, backtests, and selection bias.",
    next: "Bayesian updating, MLE, confidence intervals, E/Var algebra, covariance, and time series.",
  },
  {
    area: "Market making",
    score: "62%",
    level: "Developing",
    levelClass: "developing",
    current: "Market Maker now runs the actual Avellaneda-Stoikov model — every round you compute the live reservation price r(s,q,t) = s − qγσ²(T−t) and optimal spread from real inventory and time-to-horizon, not a discrete half-spread/skew picker, then a bonus round still covers adverse selection, EV, and delta-hedge decisions. Basket Arbitrage adds a 20-puzzle/8-minute campaign hedging multi-leg commodity baskets to zero inventory.",
    next: "Order-book depth, execution, queue position, volatility trading, and a fuller market simulation.",
  },
  {
    area: "Options / finance theory",
    score: "60%",
    level: "Strong",
    levelClass: "strong",
    current: "Delta Defender: write a real hedgeRatio(S,K,T,r,sigma) function, graded against live Black-Scholes delta over a fresh random strike/expiry/vol and GBM path every run. Put-call parity, straddles, and portfolios remain inside Market Maker.",
    next: "Vega and rho, implied volatility, VaR, duration and convexity, and a full options-portfolio construction exercise.",
  },
  {
    area: "Stochastic processes",
    score: "62%",
    level: "Developing",
    levelClass: "developing",
    current: "Ruin Walker is now the actual Cramér–Lundberg ruin model — a compound-Poisson claims process against premium income, with the closed-form adjustment coefficient R and exact ruin probability ψ(u) = (1/(1+θ))e^(−Ru) computed live against your changing surplus, not a symmetric ±1 walk. Martingale Mutiny still covers the Poisson-shock, one-step E[Xₙ] recursion and optional-stopping side.",
    next: "General transition-matrix Markov chains, Brownian motion / Ito's lemma intuition, and first-passage-time problems beyond the two games already built.",
  },
  {
    area: "Algorithms / coding",
    score: "82%",
    level: "Strong",
    levelClass: "strong",
    current: "DP Table Builder, Monte Carlo Estimator, Speed Round, plus Mini Task's 32 quant-focused challenges across four levels. The bank now covers graphs, trees, heaps, complexity, SQL-style grouping/joins/window logic, and deterministic Markov simulation, with real JavaScript tests and pre/post concept questions. The Quant Developer assessment now runs 4 real coding problems (LRU cache, streaming median, max-profit, Dijkstra) with self-calibrating performance gates, not multiple choice — a correct-but-slow submission fails, same as it would on the real screen.",
    next: "Actual SQL execution, Python/pandas, debugging under time pressure, and full mixed coding assessments that combine several patterns in one session.",
  },
  {
    area: "Calculus / linear algebra",
    score: "55%",
    level: "Foundation",
    levelClass: "foundation",
    current: "Taylor, Lagrange, eigenvectors, PSD matrices, and Newton steps in five separate games.",
    next: "Gradients, Hessians, Jacobians, projections, SVD/QR, matrix calculus, and optimization interpretation.",
  },
];

const priorities = [
  {
    title: "Probability and statistics depth",
    detail: "Add joint laws, covariance, conditional expectation, order statistics, Bayes, MLE, and confidence intervals before adding more surface-level topics. Still the largest real gap on the board.",
  },
  {
    title: "Coding depth",
    detail: "Mini Task now has 32 real-test challenges across four levels, including graphs, trees, heaps, complexity, SQL-style operations, and Markov simulation. The next coding layer is actual SQL/Python-pandas, debugging, and timed mixed assessments.",
  },
  {
    title: "Options tail: implied vol, VaR, duration/convexity",
    detail: "Delta Defender covers Black-Scholes and live delta-hedging directly. What's left is a narrower list: implied volatility, Value at Risk, and duration/convexity for rates.",
  },
  {
    title: "Stochastic processes: general Markov chains and Brownian motion",
    detail: "Ruin Walker and Martingale Mutiny cover absorbing chains and optional stopping. General transition-matrix chains and an Ito's-lemma-level treatment of Brownian motion are the remaining layer.",
  },
  {
    title: "Market microstructure",
    detail: "Basket Arbitrage now covers multi-leg inventory hedging. Still missing: order-book depth, queue position, and execution games to go with Market Maker — linear algebra itself is now well covered by Gradient Lab's five games.",
  },
];

export default function AuditPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content audit-content">
          <p className="pirate-kicker">Outcry // Latest audit</p>
          <h1 className="pirate-story-line answer-title">Readiness Audit</h1>
          <p className="audit-lede">
            This measures playable topic coverage, not your probability of receiving an offer. A real assessment also tests
            communication, speed under pressure, debugging, and whether you can recover when your first idea fails.
          </p>

          <div className="audit-count-line">
            <strong>45 playable modes plus 32 coding challenges</strong> across the current labs, counting Pick 3/4/5, timed/not-timed Scratch-Off, Gradient Lab's five sub-games, and Mini Task's four levels as separate modes. Delta Defender and Martingale Mutiny now require writing or predicting the actual math live, not just picking multiple choice, and the Quant Developer assessment now grades actual submitted code against hidden tests and a performance budget. New this round: Market Maker and Ruin Walker were rebuilt on real closed-form models (Avellaneda–Stoikov quoting and Cramér–Lundberg ruin theory) instead of discrete pickers, Crack the Bot adds a genuine multiple-regression confounder check, and a new Interview Questions hub surfaces real, scraper-sourced OA/interview reports by firm and topic. Recent icon and naming changes do not inflate this readiness score.
          </div>

          <h2 className="audit-heading">Current coverage</h2>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Coverage</th>
                  <th>What is playable now</th>
                  <th>What is next</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row) => (
                  <tr key={row.area}>
                    <th scope="row">{row.area}</th>
                    <td><span className={`audit-level audit-level-${row.levelClass}`}>{row.level} / {row.score}</span></td>
                    <td>{row.current}</td>
                    <td>{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="audit-heading">Role readiness</h2>
          <div className="audit-role-list">
            <p><strong>Quant trading: about 82-87% coverage.</strong> Up from the previous 80-85% estimate. Market Maker now tests the real Avellaneda–Stoikov reservation-price formula live each round instead of a discrete picker — closer to how a trading screen actually asks "what's your quote and why." Implied vol, VaR, richer order-book depth, and mixed timed practice are the main remaining gaps.</p>
            <p><strong>Quant research: about 68-73% coverage.</strong> Up from 66-71%. Crack the Bot's confounder check (multiple regression, omitted-variable bias) is a real research-interview staple now covered live with real data, and Ruin Walker's Cramér–Lundberg model adds a genuine actuarial/stochastic modeling case. Statistical inference proper (MLE, Bayesian updating, confidence intervals) is still the biggest remaining gap.</p>
            <p><strong>Quant developer: about 70-75% coverage.</strong> Up from 66-72%. The Quant Developer assessment now grades 4 real submitted-code problems against hidden tests and a performance gate instead of multiple choice — closer to what HackerRank/CodeSignal screens actually look like. The remaining gap is production-style depth: actual SQL and pandas, debugging, timed mixed problems, and systems-oriented coding.</p>
          </div>

          <h2 className="audit-heading">Build next</h2>
          <ol className="audit-priority-list">
            {priorities.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ol>

          <p className="audit-note">
            The fastest route to a stronger trader assessment is not adding every advanced topic. It is building a mixed weekly set:
            mental math, probability, estimation, one market decision, and one explanation spoken aloud without looking at the answer.
          </p>

          <div className="audit-sources">
            <p className="audit-source-label">Calibration references</p>
            <a href="https://www.janestreet.com/trading-interviews/">Jane Street trading interviews</a>
            <a href="https://www.janestreet.com/join-jane-street/interviewing/">Jane Street role-by-role interview guidance</a>
            <a href="https://www.optiver.com/join-us/students/internships/trading/">Optiver trading internship overview</a>
            <a href="https://www.optiver.com/join-us/stories/optiver-interview-tips-for-software-engineers/">Optiver software engineering interview tips</a>
          </div>
        </div>
      </main>
    </>
  );
}
