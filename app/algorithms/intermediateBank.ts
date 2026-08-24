import type { CodingChallenge } from "./codingTypes";

export const INTERMEDIATE_CHALLENGES: CodingChallenge[] = [
  {
    level: "intermediate",
    title: "Maximum Subarray Profit (Kadane's)",
    prompt: "Given an array of minute-by-minute integer PnL fluctuations, find the contiguous subarray containing at least one number with the largest sum and return that sum.",
    functionName: "maxContiguousProfit",
    starterCode: `function maxContiguousProfit(pnl) {
  // your code here
}`,
    referenceSolution: `function maxContiguousProfit(pnl) {
  let best = pnl[0];
  let current = pnl[0];
  for (let i = 1; i < pnl.length; i++) {
    current = Math.max(pnl[i], current + pnl[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    testCases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, label: "maxContiguousProfit([-2,1,-3,4,-1,2,1,-5,4])" },
      { args: [[1]], expected: 1, label: "maxContiguousProfit([1])" },
      { args: [[-5, -2, -9]], expected: -2, label: "maxContiguousProfit([-5,-2,-9])" },
    ],
    preQuestions: [
      { prompt: "What is the name of the optimal algorithm?", choices: ["Dijkstra's", "Kadane's", "Kruskal's", "Bellman-Ford"], answer: 1, explanation: "Kadane's algorithm tracks the best subarray ending at the current position." },
      { prompt: "If the current running sum becomes negative, what should happen?", choices: ["Stop", "Start a new subarray at the next element", "Take its absolute value", "Multiply by -1"], answer: 1, explanation: "A negative prefix can only reduce every future extension." },
    ],
    postQuestions: [
      { prompt: "What is Kadane's time complexity?", choices: ["O(log N)", "O(N)", "O(N log N)", "O(N²)"], answer: 1, explanation: "The algorithm makes one pass with constant work per element." },
      { prompt: "Why can the answer be -2 for [-5, -2, -9]?", choices: ["It is a bug", "The least-negative single element is optimal", "Subarrays must have length 2", "It defaults to the middle"], answer: 1, explanation: "The problem requires a non-empty subarray, and adding negative values makes the sum smaller." },
    ],
  },
];
