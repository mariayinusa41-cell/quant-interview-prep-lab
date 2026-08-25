import type { CodingChallenge, MiniLevel } from "./codingTypes";
import { ADVANCED_CHALLENGES } from "./advancedBank";
import { INTERMEDIATE_CHALLENGES } from "./intermediateBank";
import { NOVICE_CHALLENGES } from "./noviceBank";
import { ROOKIE_CHALLENGES } from "./rookieBank";
import { QUANT_TOPIC_CHALLENGES } from "./quantTopicsBank";

export type { CodingChallenge, MCQuestion, MiniLevel } from "./codingTypes";

export const LEVEL_LABELS: Record<MiniLevel, string> = {
  rookie: "Rookie",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const BASE_CHALLENGES: CodingChallenge[] = [
  {
    level: "rookie",
    title: "Reverse a String",
    prompt: "Write reverseString(s) that returns the input string reversed.",
    functionName: "reverseString",
    starterCode: `function reverseString(s) {
  // your code here
}`,
    referenceSolution: `function reverseString(s) {
  return s.split("").reverse().join("");
}`,
    testCases: [
      { args: ["cat"], expected: "tac", label: 'reverseString("cat")' },
      { args: [""], expected: "", label: 'reverseString("")' },
      { args: ["a"], expected: "a", label: 'reverseString("a")' },
      { args: ["racecar"], expected: "racecar", label: 'reverseString("racecar")' },
      { args: ["Quant"], expected: "tnauQ", label: 'reverseString("Quant")' },
    ],
    preQuestions: [
      {
        prompt: "Which built-in approach reverses a JS string most directly?",
        choices: [".split(\"\").reverse().join(\"\")", ".slice().sort()", ".map(c => c)", ".toUpperCase()"],
        answer: 0,
        explanation: "Strings aren't arrays in JS, so split() turns it into one, reverse() flips the array, and join() glues it back into a string.",
      },
      {
        prompt: "What's the time complexity of reversing a string of length n this way?",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        answer: 2,
        explanation: "Each of split/reverse/join touches every character once - linear work.",
      },
    ],
    postQuestions: [
      {
        prompt: "What would calling your function twice in a row on the same string return?",
        choices: ["The original string back", "An error", "An empty string", "Undefined behavior"],
        answer: 0,
        explanation: "Reversing is its own inverse - reverse(reverse(s)) === s.",
      },
      {
        prompt: "What's the space complexity of the split/reverse/join approach?",
        choices: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        answer: 1,
        explanation: "split() allocates a new array of n characters, and join() allocates a new string of length n.",
      },
    ],
  },
  {
    level: "novice",
    title: "Power of Two",
    prompt: "Write isPowerOfTwo(n) that returns true if n is a power of two, false otherwise (including for n ≤ 0).",
    functionName: "isPowerOfTwo",
    starterCode: `function isPowerOfTwo(n) {
  // your code here
}`,
    referenceSolution: `function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,
    testCases: [
      { args: [16], expected: true, label: "isPowerOfTwo(16)" },
      { args: [18], expected: false, label: "isPowerOfTwo(18)" },
      { args: [1], expected: true, label: "isPowerOfTwo(1)" },
      { args: [0], expected: false, label: "isPowerOfTwo(0)" },
      { args: [1024], expected: true, label: "isPowerOfTwo(1024)" },
      { args: [-8], expected: false, label: "isPowerOfTwo(-8)" },
    ],
    preQuestions: [
      {
        prompt: "Which bitwise expression is true exactly when n (n > 0) is a power of two?",
        choices: ["n % 2 === 0", "(n & (n - 1)) === 0", "n >> 1 === 0", "(n | 1) === n"],
        answer: 1,
        explanation: "A power of two has exactly one set bit; n − 1 flips every bit below it, so ANDing clears that bit only in that case.",
      },
      {
        prompt: "Why does the function need an explicit n > 0 guard?",
        choices: [
          "It's unnecessary and can be removed",
          "Without it, 0 would incorrectly pass the bitwise check",
          "Negative numbers crash JavaScript's & operator",
          "It makes the function run faster",
        ],
        answer: 1,
        explanation: "0 & -1 evaluates to 0 in JS's two's-complement bitwise math, so the guard is what actually excludes 0 (and negatives).",
      },
    ],
    postQuestions: [
      {
        prompt: "What's the time complexity of the bitwise solution?",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        answer: 0,
        explanation: "A fixed number of bitwise operations regardless of how large n is.",
      },
      {
        prompt: "What's a correct (if slower) alternative that avoids bitwise operators entirely?",
        choices: [
          "Repeatedly divide by 2, checking the remainder each time, until you hit 1 or an odd remainder - O(log n)",
          "Sort the digits of n",
          "Convert n to a string and check its length",
          "Always return true",
        ],
        answer: 0,
        explanation: "Dividing by 2 until you can't evenly anymore mirrors what the bitwise trick does implicitly, just slower.",
      },
    ],
  },
  {
    level: "intermediate",
    title: "Maximum Subarray",
    prompt: "Write maxSubarray(nums) that returns the largest sum of any contiguous subarray of nums (Kadane's algorithm).",
    functionName: "maxSubarray",
    starterCode: `function maxSubarray(nums) {
  // your code here
}`,
    referenceSolution: `function maxSubarray(nums) {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    testCases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, label: "maxSubarray([-2,1,-3,4,-1,2,1,-5,4])" },
      { args: [[-5, -2, -8]], expected: -2, label: "maxSubarray([-5,-2,-8])" },
      { args: [[1, 2, 3, 4]], expected: 10, label: "maxSubarray([1,2,3,4])" },
      { args: [[5]], expected: 5, label: "maxSubarray([5])" },
      { args: [[-1, -2, 3, -1, 2]], expected: 4, label: "maxSubarray([-1,-2,3,-1,2])" },
    ],
    preQuestions: [
      {
        prompt: "Kadane's algorithm runs in what time for an array of length n?",
        choices: ["O(1)", "O(n)", "O(n log n)", "O(n²)"],
        answer: 1,
        explanation: "A single left-to-right pass, constant work per element.",
      },
      {
        prompt: "At each step, what should the running `current` value represent?",
        choices: [
          "The total sum of the whole array",
          "The best sum of a contiguous subarray ending exactly at this index",
          "The single largest element seen so far",
          "The index of the current maximum",
        ],
        answer: 1,
        explanation: "That's what lets you decide, at each step, whether extending the previous run beats starting fresh.",
      },
    ],
    postQuestions: [
      {
        prompt: "Why does your solution return -2 for an all-negative input like [-5, -2, -8]?",
        choices: [
          "It's a bug - it should return 0",
          "Because the least-negative single element is the best any contiguous subarray can do here",
          "Because the array length is 3",
          "It shouldn't - that's undefined behavior",
        ],
        answer: 1,
        explanation: "With every element negative, any subarray longer than one element only makes the sum worse, so the best is the least-bad single element.",
      },
      {
        prompt: "What's the space complexity of Kadane's algorithm?",
        choices: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        answer: 0,
        explanation: "Only two running variables are kept regardless of array size.",
      },
    ],
  },
  {
    level: "advanced",
    title: "Fast Fibonacci",
    prompt:
      "Write fib(n) that returns the nth Fibonacci number (fib(0) = 0, fib(1) = 1). One of the test cases uses n = 42 under a 3-second limit - naive recursion is order-of-seconds too slow for that, so it specifically tests whether your solution avoids exponential blowup.",
    functionName: "fib",
    starterCode: `function fib(n) {
  // your code here — naive recursion will time out on the larger test case
}`,
    referenceSolution: `function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return a;
}`,
    testCases: [
      { args: [0], expected: 0, label: "fib(0)" },
      { args: [1], expected: 1, label: "fib(1)" },
      { args: [10], expected: 55, label: "fib(10)" },
      { args: [20], expected: 6765, label: "fib(20)" },
      { args: [42], expected: 267914296, label: "fib(42) - under a 3s limit" },
    ],
    preQuestions: [
      {
        prompt: "Naive recursive Fibonacci (no memoization, no iteration) has what time complexity?",
        choices: ["O(n)", "O(n²)", "O(2ⁿ)", "O(n!)"],
        answer: 2,
        explanation: "Every call branches into two more, roughly doubling the work at each level down to depth n.",
      },
      {
        prompt: "What's the core idea that turns exponential Fibonacci into linear time?",
        choices: [
          "Caching (or just never recomputing) each fib(k) so it's only computed once",
          "Sorting the inputs first",
          "Using BigInt instead of Number",
          "Removing the base cases",
        ],
        answer: 0,
        explanation: "Whether you memoize a recursive version or just build up iteratively, the win is the same: never solve the same subproblem twice.",
      },
    ],
    postQuestions: [
      {
        prompt: "If your fib(42) test passed within the time limit, what does that actually tell you?",
        choices: [
          "That your implementation avoids naive O(2ⁿ) recursion - it's doing something closer to O(n)",
          "Nothing - the test case was too easy either way",
          "That JavaScript is always fast enough for recursion",
          "That the test case was wrong",
        ],
        answer: 0,
        explanation: "Naive recursive fib(42) makes on the order of hundreds of millions of redundant calls (multiple seconds even in a fast engine) - finishing instantly is direct evidence you're reusing work instead of recomputing it.",
      },
      {
        prompt: "What's the space complexity of an iterative Fibonacci that only keeps the last two values?",
        choices: ["O(1)", "O(n)", "O(2ⁿ)", "O(log n)"],
        answer: 0,
        explanation: "You only need `a` and `b` at any point - constant extra space, independent of n.",
      },
    ],
  },
];

export const CODING_CHALLENGES: CodingChallenge[] = [
  ...BASE_CHALLENGES,
  ...ROOKIE_CHALLENGES,
  ...NOVICE_CHALLENGES,
  ...INTERMEDIATE_CHALLENGES,
  ...ADVANCED_CHALLENGES,
  ...QUANT_TOPIC_CHALLENGES,
];

export function challengesForLevel(level: MiniLevel): CodingChallenge[] {
  return CODING_CHALLENGES.filter((c) => c.level === level);
}
