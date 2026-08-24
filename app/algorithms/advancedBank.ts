import type { CodingChallenge } from "./codingTypes";

export const ADVANCED_CHALLENGES: CodingChallenge[] = [
  {
    level: "advanced",
    title: "Option Strike Search (Binary Search)",
    prompt: "Given a strictly increasing array of available option strike prices and a target stock price, write closestStrike(strikes, target) that returns the mathematically closest strike in O(log N) time.",
    functionName: "closestStrike",
    starterCode: `function closestStrike(strikes, target) {
  // your code here
}`,
    referenceSolution: `function closestStrike(strikes, target) {
  let left = 0;
  let right = strikes.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (strikes[mid] === target) return strikes[mid];
    if (strikes[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  if (left >= strikes.length) return strikes[right];
  if (right < 0) return strikes[left];
  return Math.abs(strikes[left] - target) < Math.abs(strikes[right] - target) ? strikes[left] : strikes[right];
}`,
    testCases: [
      { args: [[100, 110, 120, 130], 114], expected: 110, label: "closestStrike([100,110,120,130], 114)" },
      { args: [[10, 20, 30], 26], expected: 30, label: "closestStrike([10,20,30], 26)" },
      { args: [[50, 100], 10], expected: 50, label: "closestStrike([50,100], 10)" },
    ],
    preQuestions: [
      { prompt: "Why use binary search instead of a standard loop?", choices: ["The array is too large", "The prompt requires O(log N)", "It uses less memory", "Loops cannot compare distance"], answer: 1, explanation: "Sorted input lets binary search discard half the remaining range each step." },
      { prompt: "How is the midpoint calculated?", choices: ["mid = left + 1", "mid = right - left", "Math.floor((left + right) / 2)", "Math.random()"], answer: 2, explanation: "The midpoint splits the current inclusive search interval." },
    ],
    postQuestions: [
      { prompt: "When the loop ends without an exact match, where are left and right?", choices: ["At the array ends", "On the same element", "Straddling the target", "Both zero"], answer: 2, explanation: "Right is the last value below the target and left is the first value above it." },
      { prompt: "What is the space complexity of iterative binary search?", choices: ["O(N)", "O(log N)", "O(1)", "O(N²)"], answer: 2, explanation: "Only a constant number of pointers is stored." },
    ],
  },
];
