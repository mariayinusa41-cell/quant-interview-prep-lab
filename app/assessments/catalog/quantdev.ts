import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";
import { quantDevProblems } from "./quantdevProblems";

/** Complexity and data-structure selection under a clock. */
function complexitySet(n: number): Item[] {
  const builders = [
    (i: number) => choiceItem(
      `c-${i}`,
      "A matching engine must cancel a resting order by id in constant time. Which structure supports it?",
      "Hash map from id to a node in a doubly linked list",
      ["Sorted array of orders per price level", "Binary search over a sorted vector", "Single linked list scanned from the head"],
      "data-structures",
      "The map gives O(1) lookup and the doubly linked node gives O(1) unlink. An array still costs O(N) to shift, even when you know the index.",
    ),
    (i: number) => choiceItem(
      `c-${i}`,
      "You need the running median of a live price stream. Which approach is best?",
      "Two heaps - a max-heap of the low half and a min-heap of the high half",
      ["Sort the buffer on every tick", "A single min-heap", "A hash map of counts"],
      "data-structures",
      "Balanced heaps give O(log n) insert and O(1) median. Re-sorting is O(n log n) per tick.",
    ),
    (i: number) => {
      const n2 = rnd.pick([1000, 10000, 100000]);
      return choiceItem(
        `c-${i}`,
        `An O(n²) routine handles n = ${n2}. Roughly how much more work at n = ${n2 * 10}?`,
        "100×",
        ["10×", "20×", "1000×"],
        "complexity",
        "Squaring the growth: (10n)² = 100n². Ten times the input is a hundred times the work.",
      );
    },
    (i: number) => choiceItem(
      `c-${i}`,
      "Which best describes amortised O(1) for push_back on a dynamic array?",
      "Most pushes are constant; occasional reallocation is spread across many operations",
      ["Every push is exactly constant time", "It is O(1) only if capacity is reserved first", "It means average-case over random inputs"],
      "complexity",
      "Doubling makes reallocation rare enough that the total cost over n pushes is O(n) - amortised, not worst-case per call.",
    ),
    (i: number) => choiceItem(
      `c-${i}`,
      "Two threads increment a shared non-atomic counter. What is the defect?",
      "A data race - increment is read-modify-write and is not indivisible",
      ["A deadlock", "Priority inversion", "Nothing, increments are atomic on x86"],
      "coding-implementation",
      "Load, add, store can interleave so an increment is lost. Unsynchronised concurrent access is undefined behaviour, not merely a wrong count.",
    ),
    (i: number) => choiceItem(
      `c-${i}`,
      "A lock-free SPSC ring buffer publishes its head index with memory_order_relaxed. What can go wrong?",
      "The consumer may see the new index before the slot's data is visible",
      ["The index can wrap incorrectly", "Nothing - SPSC needs no ordering", "The producer may block"],
      "coding-implementation",
      "The publishing store needs release semantics to pair with the consumer's acquire load, or the buffer write can be reordered after it.",
    ),
    (i: number) => choiceItem(
      `c-${i}`,
      "Which change most reduces cache misses when summing a large matrix?",
      "Iterate in row-major order matching the memory layout",
      ["Use a larger integer type", "Unroll the loop 2×", "Mark the accumulator volatile"],
      "complexity",
      "Sequential access uses the whole cache line that was fetched. Striding across rows discards most of every line.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

/** Trace-the-code items: read a snippet, state the output or complexity. */
function traceSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const k = rnd.pick([4, 5, 6]);
      let v = 0;
      for (let a = 0; a < k; a += 1) for (let b = a; b < k; b += 1) v += 1;
      return {
        id: `t-${i}`, kind: "numeric" as const,
        block: `int count = 0;\nfor (int a = 0; a < ${k}; ++a)\n  for (int b = a; b < ${k}; ++b)\n    ++count;`,
        prompt: "What is the final value of count?",
        answer: v, tolerance: 0,
        skill: "complexity" as const,
        explain: `The inner loop runs ${k}, ${k - 1}, … 1 times - that is ${k}·${k + 1}/2 = ${v}.`,
      };
    },
    (i: number) => {
      const n2 = rnd.pick([16, 32, 64, 128, 1024]);
      return {
        id: `t-${i}`, kind: "numeric" as const,
        block: `int steps = 0;\nfor (int n = ${n2}; n > 1; n /= 2)\n  ++steps;`,
        prompt: "What is the final value of steps?",
        answer: Math.log2(n2), tolerance: 0,
        skill: "complexity" as const,
        explain: `Halving until 1 takes log₂(${n2}) = ${Math.log2(n2)} steps.`,
      };
    },
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

export const QUANTDEV_ASSESSMENT: Assessment = {
  id: "asmt-hrt-quantdev",
  firm: "Hudson River Trading-style",
  title: "Quant Developer Online Assessment",
  track: "quant-dev",
  blurb:
    "Modelled on the HackerRank and CodeSignal screens that gate low-latency engineering roles: four problems you implement and submit, auto-graded against hidden tests, with performance constraints that fail a correct-but-slow solution.",
  rules: [
    "Four coding problems in 100 minutes. Budget roughly 25 minutes each.",
    "Write JavaScript. Submissions run against hidden test cases you cannot see.",
    "Two problems carry a performance gate - passing the tests is not sufficient if the approach does not scale.",
    "You may run your code as often as you like. Only your last run counts.",
    "A short code-review section follows the coding problems.",
  ],
  sections: [
    {
      id: "code",
      name: "Coding problems",
      brief: "Four problems, 100 minutes. Implement each function and run it against the hidden tests.",
      seconds: 100 * 60,
      penalty: 0,
      allowBack: false,
      itemCount: 4,
      generate: () => quantDevProblems(),
    },
    {
      id: "review",
      name: "Code review",
      brief: "10 items, 15 minutes. Read concurrent and performance-sensitive code and identify the defect.",
      seconds: 15 * 60,
      penalty: 0,
      allowBack: false,
      itemCount: 10,
      generate: () => complexitySet(10),
    },
  ],
};
