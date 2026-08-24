export type SpeedQuestion = {
  topic: string;
  prompt: string;
  code?: string;
  choices: string[];
  answer: number; // index into choices, before shuffling
  explanation: string;
};

export const SPEED_QUESTIONS: SpeedQuestion[] = [
  // --- Complexity ---
  {
    topic: "Complexity",
    prompt: "What is the time complexity of this routine?",
    code: "for i in range(n):\n    for j in range(i, n):\n        work(i, j)",
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    answer: 2,
    explanation: "The inner loop runs about n − i times. Summing those lengths gives n + (n−1) + … + 1 = O(n²).",
  },
  {
    topic: "Complexity",
    prompt: "A sorted array is searched by repeatedly halving the remaining interval. What is the runtime?",
    choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    answer: 1,
    explanation: "Each comparison removes half the candidates, so the number of comparisons grows as log₂(n).",
  },
  {
    topic: "Complexity",
    prompt: "Merge sort splits the array in half, recurses, then merges two sorted halves in linear time. What's the runtime?",
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 1,
    explanation: "log n levels of recursion, each doing O(n) work to merge, gives O(n log n) total.",
  },
  {
    topic: "Complexity",
    prompt: "What is the time complexity of computing the nth Fibonacci number with naive recursion (no memoization)?",
    code: "fib(n) = fib(n-1) + fib(n-2)",
    choices: ["O(n)", "O(n²)", "O(2ⁿ)", "O(n!)"],
    answer: 2,
    explanation: "Each call spawns two more, and the recursion tree has depth n — roughly 2ⁿ total calls.",
  },
  {
    topic: "Complexity",
    prompt: "Visiting every pair of elements in an array of size n takes how long?",
    code: "for i in range(n):\n    for j in range(n):\n        pair(i, j)",
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(n³)"],
    answer: 2,
    explanation: "Two independent loops each running the full n gives n × n = O(n²), unlike the triangular loop above.",
  },
  {
    topic: "Complexity",
    prompt: "Which of these grows fastest as n increases?",
    choices: ["O(n log n)", "O(n²)", "O(2ⁿ)", "O(n^100)"],
    answer: 2,
    explanation: "Exponential functions eventually outgrow every fixed polynomial, no matter how large the polynomial's exponent.",
  },
  {
    topic: "Complexity",
    prompt: "Building a hash set from n elements and checking membership of each takes roughly what time, on average?",
    choices: ["O(1)", "O(n)", "O(n log n)", "O(n²)"],
    answer: 1,
    explanation: "Each insert/lookup is O(1) amortized on average, and there are n of them, giving O(n) total.",
  },
  // --- Dynamic programming ---
  {
    topic: "Dynamic programming",
    prompt: "Which property makes a problem a strong dynamic-programming candidate?",
    choices: ["Every choice is locally optimal", "Overlapping subproblems and optimal substructure", "The input is already sorted", "The output is a single number"],
    answer: 1,
    explanation: "DP stores answers to overlapping subproblems and combines them using optimal substructure. Greedy choice is a separate claim.",
  },
  {
    topic: "Dynamic programming",
    prompt: "Naive recursive Fibonacci is exponential. What does memoization change?",
    code: "F(n) = F(n−1) + F(n−2)",
    choices: ["O(2ⁿ) to O(n)", "O(n²) to O(log n)", "O(n) to O(1)", "It does not change the runtime"],
    answer: 0,
    explanation: "Each F(k) is computed once and then reused. There are n distinct states, so the time and memory are linear.",
  },
  {
    topic: "Dynamic programming",
    prompt: "What's the key difference between top-down (memoized recursion) and bottom-up (tabulation) DP?",
    choices: [
      "Top-down is always faster",
      "Bottom-up only computes subproblems it actually needs; top-down fills the whole table",
      "Top-down recurses and caches; bottom-up iterates and fills a table in dependency order",
      "There is no real difference",
    ],
    answer: 2,
    explanation: "Same recurrence, different direction: top-down starts from the answer and recurses down, bottom-up starts from base cases and builds up.",
  },
  {
    topic: "Dynamic programming",
    prompt: "For the coin-change minimum-coins problem, why does trying every coin at each amount work?",
    choices: [
      "Because coins are always sorted",
      "Because the optimal solution for amount A must use the optimal solution for some smaller amount A−c",
      "Because greedy always finds the optimum",
      "It doesn't work in general",
    ],
    answer: 1,
    explanation: "That's optimal substructure: the best way to make A includes the best way to make A−c for whichever coin c you used last.",
  },
  {
    topic: "Dynamic programming",
    prompt: "A DP recurrence only ever looks at the previous 2 states (like Fibonacci). What's the best space complexity achievable?",
    choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    answer: 0,
    explanation: "You only need to keep the last two values around, not the whole table — a classic DP space optimization.",
  },
  {
    topic: "Dynamic programming",
    prompt: "Why can greedy (always take the largest coin) fail at making minimum coin change?",
    choices: [
      "It never fails",
      "With coin sets like {1, 3, 4}, greedy on amount 6 picks 4+1+1 (3 coins) instead of the optimal 3+3 (2 coins)",
      "Greedy is only for sorting problems",
      "Greedy requires floating point",
    ],
    answer: 1,
    explanation: "Greedy is locally optimal but not globally optimal for arbitrary coin systems — that's exactly why coin change needs DP instead.",
  },
  // --- Monte Carlo ---
  {
    topic: "Monte Carlo",
    prompt: "A Monte Carlo estimator has sample standard deviation s and N independent paths. What is its standard error?",
    choices: ["s × N", "s / N", "s / √N", "√s / N"],
    answer: 2,
    explanation: "For independent samples, standard error is s / √N. To halve error, you need roughly four times as many paths.",
  },
  {
    topic: "Monte Carlo",
    prompt: "You can increase paths or use a good control variate. Which statement is true?",
    choices: ["Only more paths can reduce variance", "A control variate can reduce variance without changing the target mean", "Variance reduction changes the payoff definition", "Control variates only help deterministic code"],
    answer: 1,
    explanation: "A correlated variable with known expectation can remove noise from the estimator while preserving its expected value.",
  },
  {
    topic: "Monte Carlo",
    prompt: "What is antithetic variates, in one line?",
    choices: [
      "Running the simulation twice and averaging the two totals",
      "Pairing each random draw with its mirror (e.g. U and 1−U) so their errors partially cancel",
      "Using a bigger random seed",
      "Discarding outlier paths",
    ],
    answer: 1,
    explanation: "Antithetic variates pair negatively correlated samples so the average has lower variance than two independent draws.",
  },
  {
    topic: "Monte Carlo",
    prompt: "Your estimator's standard error is currently 0.02. To get it down to 0.01, how many times more paths do you need?",
    choices: ["2×", "4×", "10×", "100×"],
    answer: 1,
    explanation: "SE shrinks as 1/√N, so halving SE requires quadrupling N.",
  },
  {
    topic: "Monte Carlo",
    prompt: "Why is Monte Carlo often preferred over grid-based numerical integration in high dimensions?",
    choices: [
      "Monte Carlo error doesn't depend on dimension the way grid methods' cost does",
      "Monte Carlo is always more accurate",
      "Grids can't represent random variables",
      "Monte Carlo requires no computation",
    ],
    answer: 0,
    explanation: "Grid methods scale exponentially with dimension (curse of dimensionality); Monte Carlo's O(1/√N) error rate doesn't.",
  },
  // --- Python / pandas ---
  {
    topic: "Python / pandas",
    prompt: "What is the idiomatic pandas operation for average P&L by desk?",
    code: "trades[[\"desk\", \"pnl\"]]  →  average pnl for each desk",
    choices: ["trades.groupby(\"desk\")[\"pnl\"].mean()", "trades.sort_values(\"desk\")", "trades.concat(\"desk\")", "trades.iloc.mean(\"desk\")"],
    answer: 0,
    explanation: "groupby defines the partition and mean reduces the P&L column within each group.",
  },
  {
    topic: "Python / pandas",
    prompt: "Two DataFrames share a trade_id column and you need to attach execution timestamps. What should you use?",
    choices: ["merge on trade_id", "concat by row position", "apply a random shuffle", "drop_duplicates on both frames"],
    answer: 0,
    explanation: "merge joins records by a key. concat stacks frames; it does not match rows by trade_id unless the indexes already carry that meaning.",
  },
  {
    topic: "Python / pandas",
    prompt: "You need a 20-day rolling average of a price column. What's idiomatic?",
    choices: ["prices.rolling(20).mean()", "prices.groupby(20).mean()", "prices.resample(20).mean()", "prices.apply(lambda x: x[-20:].mean())"],
    answer: 0,
    explanation: "rolling(window) creates a moving window; .mean() reduces each window. resample is for changing time frequency, not windowing.",
  },
  {
    topic: "Python / pandas",
    prompt: "You want one row per (date, desk) combination, with pnl summed, from a long trade log. What's the tool?",
    choices: ["df.pivot_table(index='date', columns='desk', values='pnl', aggfunc='sum')", "df.melt()", "df.drop_duplicates()", "df.T"],
    answer: 0,
    explanation: "pivot_table reshapes long data into a wide (date × desk) grid while aggregating with the given function.",
  },
  {
    topic: "Python / pandas",
    prompt: "Why is `df['pnl'].apply(lambda x: x * 2)` usually slower than `df['pnl'] * 2` on a large DataFrame?",
    choices: [
      "apply is faster, not slower",
      "Vectorized operations run in compiled C loops over the whole column; apply calls a Python function once per row",
      "apply uses less memory so it's always preferred",
      "There is no difference",
    ],
    answer: 1,
    explanation: "Vectorization is the entire reason pandas/numpy are fast — falling back to per-row Python function calls gives that up.",
  },
  {
    topic: "Python / pandas",
    prompt: "merge(how='left') vs merge(how='inner') — what's the difference?",
    choices: [
      "left keeps every row from the left frame even without a match; inner keeps only matching rows from both",
      "They're identical",
      "left only works on the index",
      "inner keeps unmatched rows too",
    ],
    answer: 0,
    explanation: "left join preserves the left frame's rows (filling unmatched columns with NaN); inner join keeps only the intersection.",
  },
];
