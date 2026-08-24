import type { CodingChallenge } from "./codingTypes";

export const NOVICE_CHALLENGES: CodingChallenge[] = [
  {
    level: "novice",
    title: "Target Net Position (Two Sum)",
    prompt: "Given an array of integer trade PnLs and a target net profit, write findTradePair(trades, target) that returns the indices of the two trades that add up exactly to the target. Assume exactly one valid pair exists.",
    functionName: "findTradePair",
    starterCode: `function findTradePair(trades, target) {
  // your code here
}`,
    referenceSolution: `function findTradePair(trades, target) {
  const seen = new Map();
  for (let i = 0; i < trades.length; i++) {
    const complement = target - trades[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(trades[i], i);
  }
  return [];
}`,
    testCases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1], label: "findTradePair([2, 7, 11, 15], 9)" },
      { args: [[3, 2, 4], 6], expected: [1, 2], label: "findTradePair([3, 2, 4], 6)" },
      { args: [[-10, 5, 20, -5], 10], expected: [0, 2], label: "findTradePair([-10, 5, 20, -5], 10)" },
    ],
    preQuestions: [
      { prompt: "What is the time complexity of a naive nested-loop approach?", choices: ["O(N)", "O(N log N)", "O(N²)", "O(1)"], answer: 2, explanation: "Checking every pair requires quadratically many comparisons." },
      { prompt: "Which data structure reduces average lookup time to O(1)?", choices: ["Binary search tree", "Hash map", "Linked list", "Stack"], answer: 1, explanation: "A hash map stores complements for constant-average-time lookup." },
    ],
    postQuestions: [
      { prompt: "What is the space complexity tradeoff of the hash-map solution?", choices: ["O(1)", "O(log N)", "O(N)", "O(N²)"], answer: 2, explanation: "The map can hold up to N - 1 previously seen values." },
      { prompt: "If the input were already sorted, which approach can use O(1) extra space?", choices: ["Two pointers from both ends", "Binary-search every element", "A hash map", "A linked list"], answer: 0, explanation: "Two pointers move inward based on whether their sum is below or above the target." },
    ],
  },
];
