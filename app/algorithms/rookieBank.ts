import type { CodingChallenge } from "./codingTypes";

export const ROOKIE_CHALLENGES: CodingChallenge[] = [
  {
    level: "rookie",
    title: "Maximum Drawdown",
    prompt: "Given an array of historical stock prices, write maxDrawdown(prices) that returns the maximum loss from a peak to a later trough. If the price never drops, return 0.",
    functionName: "maxDrawdown",
    starterCode: `function maxDrawdown(prices) {
  // your code here
}`,
    referenceSolution: `function maxDrawdown(prices) {
  let maxLoss = 0;
  let peak = prices[0];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) peak = prices[i];
    else maxLoss = Math.max(maxLoss, peak - prices[i]);
  }
  return maxLoss;
}`,
    testCases: [
      { args: [[100, 90, 80, 120, 150]], expected: 20, label: "maxDrawdown([100, 90, 80, 120, 150])" },
      { args: [[10, 20, 30, 40]], expected: 0, label: "maxDrawdown([10, 20, 30, 40])" },
      { args: [[50, 40, 10, 5, 50]], expected: 45, label: "maxDrawdown([50, 40, 10, 5, 50])" },
    ],
    preQuestions: [
      { prompt: "To find maximum drawdown in O(n) time, what must you track?", choices: ["Only the global minimum", "The running highest peak", "The average so far", "The total sum"], answer: 1, explanation: "Drawdown compares a price to a peak that occurred before it, so the running maximum is the key state." },
      { prompt: "What is the time complexity of the optimal solution?", choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2, explanation: "The prices are scanned once." },
    ],
    postQuestions: [
      { prompt: "If the input is strictly increasing, what should drawdown be?", choices: ["The first-to-last difference", "0", "Undefined", "Infinity"], answer: 1, explanation: "There is no later trough below a prior peak." },
      { prompt: "Why initialize peak to prices[0] instead of 0?", choices: ["It is faster", "It handles inputs whose prices are all negative", "It sorts the data", "It prevents recursion"], answer: 1, explanation: "Zero may not be a valid observed price, so the first observation is the correct initial peak." },
    ],
  },
  {
    level: "rookie",
    title: "Simple Moving Average",
    prompt: "Write movingAverage(data, windowSize) that returns the simple moving average for each full window. If the window is invalid or too large, return an empty array.",
    functionName: "movingAverage",
    starterCode: `function movingAverage(data, windowSize) {
  // your code here
}`,
    referenceSolution: `function movingAverage(data, windowSize) {
  if (windowSize <= 0 || windowSize > data.length) return [];
  const result = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= windowSize) sum -= data[i - windowSize];
    if (i >= windowSize - 1) result.push(sum / windowSize);
  }
  return result;
}`,
    testCases: [
      { args: [[1, 2, 3, 4, 5], 3], expected: [2, 3, 4], label: "movingAverage([1, 2, 3, 4, 5], 3)" },
      { args: [[10, 20], 3], expected: [], label: "movingAverage([10, 20], 3)" },
      { args: [[5, 5, 5], 1], expected: [5, 5, 5], label: "movingAverage([5, 5, 5], 1)" },
    ],
    preQuestions: [
      { prompt: "What avoids recomputing each window sum from scratch?", choices: ["Sorting", "A sliding window", "Recursion", "A stack"], answer: 1, explanation: "Add the incoming value and subtract the outgoing value to update the sum in constant time." },
      { prompt: "For input length N and window K, how many outputs are produced?", choices: ["N", "K", "N - K + 1", "N / K"], answer: 2, explanation: "The first full window ends at K - 1 and the last ends at N - 1." },
    ],
    postQuestions: [
      { prompt: "What is the extra space complexity, excluding the output?", choices: ["O(1)", "O(K)", "O(N)", "O(N²)"], answer: 0, explanation: "Only the rolling sum and loop variables are needed." },
      { prompt: "Why is recomputing every window inefficient?", choices: ["It uses too much memory", "It costs O(NK) time", "It requires a library", "It cannot handle decimals"], answer: 1, explanation: "Each of roughly N windows would rescan K values." },
    ],
  },
];
