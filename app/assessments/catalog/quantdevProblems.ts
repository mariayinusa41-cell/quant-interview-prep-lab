import type { Item } from "../engine/types";

/* Reference solutions and benchmark workloads live as source strings because
   they are evaluated inside the worker alongside the candidate's code. Each
   reference has been checked against its own test cases, and each benchmark
   has been checked to actually separate the intended solution from the naive
   one - a gate that cannot detect the mistake it exists for is worse than no
   gate at all. */

const LRU_REF = `
function createCache(capacity) {
  const m = new Map();
  return {
    get(k) { if (!m.has(k)) return -1; const v = m.get(k); m.delete(k); m.set(k, v); return v; },
    put(k, v) {
      if (m.has(k)) m.delete(k);
      else if (m.size >= capacity) m.delete(m.keys().next().value);
      m.set(k, v);
    }
  };
}`;

// cap 15000 separates map-ordering (O(1)) from an array scan (O(N)) by ~12x.
const LRU_BENCH = `
function __bench(make) {
  const c = make(15000);
  const t0 = performance.now();
  for (let i = 0; i < 25000; i++) {
    c.put((i * 7919) % 20000, i);
    if (i % 3 === 0) c.get((i * 104729) % 20000);
  }
  return performance.now() - t0;
}`;

const MEDIAN_REF = `
function createMedian() {
  const lo = [], hi = [];
  const push = (h, v) => { h.push(v); let i = h.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
  const pop = (h) => { const t = h[0], l = h.pop();
    if (h.length) { h[0] = l; let i = 0;
      for (;;) { const a = 2*i+1, b = 2*i+2; let m = i;
        if (a < h.length && h[a] < h[m]) m = a;
        if (b < h.length && h[b] < h[m]) m = b;
        if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } }
    return t; };
  return {
    add(x) {
      if (lo.length === 0 || x <= -lo[0]) push(lo, -x); else push(hi, x);
      if (lo.length > hi.length + 1) push(hi, -pop(lo));
      else if (hi.length > lo.length) push(lo, -pop(hi));
    },
    median() { if (!lo.length) return 0; return lo.length > hi.length ? -lo[0] : ((-lo[0]) + hi[0]) / 2; }
  };
}`;

const MEDIAN_BENCH = `
function __bench(make) {
  const m = make();
  const t0 = performance.now();
  for (let i = 0; i < 12000; i++) {
    m.add((i * 2654435761) % 100000);
    if (i % 2 === 0) m.median();
  }
  return performance.now() - t0;
}`;

export function quantDevProblems(): Item[] {
  return [
    {
      id: "cq-lru",
      kind: "code",
      prompt: "LRU Cache",
      description:
        "Implement a fixed-capacity least-recently-used cache. get(key) returns the value or -1 if absent; put(key, value) inserts or overwrites. Both count as a use. When the cache is full, the least recently used entry is evicted. The feed issues 25,000 operations against a 15,000-entry cache, so both operations must be O(1) - anything that scans will not finish inside the budget.",
      functionName: "createCache",
      starter: `function createCache(capacity) {
  // TODO: both get and put must be O(1).
  const store = [];

  return {
    get(key) {
      const i = store.findIndex((e) => e.key === key);
      if (i < 0) return -1;
      const entry = store.splice(i, 1)[0];
      store.push(entry);
      return entry.value;
    },
    put(key, value) {
      const i = store.findIndex((e) => e.key === key);
      if (i >= 0) store.splice(i, 1);
      else if (store.length >= capacity) store.shift();
      store.push({ key, value });
    },
  };
}`,
      tests: [
        {
          label: "evicts the least recently used entry",
          ctor: [2],
          script: [
            { call: "put", args: [1, 1] },
            { call: "put", args: [2, 2] },
            { call: "get", args: [1], expect: 1 },
            { call: "put", args: [3, 3] },
            { call: "get", args: [2], expect: -1 },
            { call: "put", args: [4, 4] },
            { call: "get", args: [1], expect: -1 },
            { call: "get", args: [3], expect: 3 },
            { call: "get", args: [4], expect: 4 },
          ],
        },
        {
          label: "a get counts as a use",
          ctor: [2],
          script: [
            { call: "put", args: [1, 1] },
            { call: "put", args: [2, 2] },
            { call: "get", args: [1], expect: 1 },
            { call: "put", args: [3, 3] },
            { call: "get", args: [1], expect: 1 },
          ],
        },
        {
          label: "overwriting keeps one entry",
          ctor: [2],
          script: [
            { call: "put", args: [1, 1] },
            { call: "put", args: [2, 2] },
            { call: "put", args: [1, 10] },
            { call: "get", args: [1], expect: 10 },
            { call: "get", args: [2], expect: 2 },
          ],
        },
        {
          label: "capacity of one",
          ctor: [1],
          script: [
            { call: "put", args: [1, 1] },
            { call: "put", args: [2, 2] },
            { call: "get", args: [1], expect: -1 },
            { call: "get", args: [2], expect: 2 },
          ],
        },
        {
          label: "missing key returns -1",
          ctor: [3],
          script: [{ call: "get", args: [99], expect: -1 }],
        },
      ],
      perf: {
        reference: LRU_REF,
        bench: LRU_BENCH,
        budget: 5,
        note: "25,000 operations against a 15,000-entry cache. A scan-based implementation runs roughly 12× the reference.",
      },
      skill: "data-structures",
      explain:
        "A Map preserves insertion order, so deleting and re-inserting on access moves an entry to the back and keys().next() gives the oldest - both O(1). An array needs a scan to find the key and a splice to move it, which is O(N) twice over.",
    },

    {
      id: "cq-median",
      kind: "code",
      prompt: "Streaming Median",
      description:
        "Maintain the running median of a live price stream. add(x) ingests a value; median() returns the current median - the middle value for an odd count, the mean of the two middle values for an even count, and 0 when empty. The feed interleaves 12,000 inserts with 6,000 median queries, so re-sorting on each query will not finish.",
      functionName: "createMedian",
      starter: `function createMedian() {
  // TODO: sorting on every query is too slow. Two heaps give O(log n) add
  // and O(1) median.
  const values = [];

  return {
    add(x) {
      values.push(x);
    },
    median() {
      if (values.length === 0) return 0;
      const s = [...values].sort((a, b) => a - b);
      const n = s.length;
      return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    },
  };
}`,
      tests: [
        {
          label: "odd and even counts",
          ctor: [],
          script: [
            { call: "add", args: [1] },
            { call: "median", args: [], expect: 1 },
            { call: "add", args: [3] },
            { call: "median", args: [], expect: 2 },
            { call: "add", args: [2] },
            { call: "median", args: [], expect: 2 },
            { call: "add", args: [10] },
            { call: "median", args: [], expect: 2.5 },
          ],
        },
        {
          label: "out-of-order arrivals",
          ctor: [],
          script: [
            { call: "add", args: [5] },
            { call: "add", args: [15] },
            { call: "add", args: [1] },
            { call: "add", args: [3] },
            { call: "median", args: [], expect: 4 },
          ],
        },
        {
          label: "empty stream returns 0",
          ctor: [],
          script: [{ call: "median", args: [], expect: 0 }],
        },
        {
          label: "duplicates are counted separately",
          ctor: [],
          script: [
            { call: "add", args: [7] },
            { call: "add", args: [7] },
            { call: "add", args: [7] },
            { call: "median", args: [], expect: 7 },
          ],
        },
        {
          label: "negative values",
          ctor: [],
          script: [
            { call: "add", args: [-5] },
            { call: "add", args: [-1] },
            { call: "add", args: [-3] },
            { call: "median", args: [], expect: -3 },
          ],
        },
      ],
      perf: {
        reference: MEDIAN_REF,
        bench: MEDIAN_BENCH,
        budget: 5,
        note: "12,000 inserts interleaved with 6,000 queries. Re-sorting each query runs over 1,000× the reference.",
      },
      skill: "data-structures",
      explain:
        "Keep a max-heap of the lower half and a min-heap of the upper half, rebalancing so their sizes differ by at most one. The median is then a peek, not a sort.",
    },

    {
      id: "cq-profit",
      kind: "code",
      prompt: "Best Single Trade",
      description:
        "Given an array of prices in chronological order, return the maximum profit from buying once and selling once, strictly later. Return 0 if no trade is profitable. A single pass is sufficient.",
      functionName: "maxProfit",
      starter: `function maxProfit(prices) {
  // TODO: one pass, tracking the lowest price seen so far.
  return 0;
}`,
      tests: [
        { label: "[7,1,5,3,6,4] → 5", args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
        { label: "monotonically falling → 0", args: [[7, 6, 4, 3, 1]], expected: 0 },
        { label: "two elements rising → 1", args: [[1, 2]], expected: 1 },
        { label: "flat prices → 0", args: [[3, 3, 3]], expected: 0 },
        { label: "late high → 8", args: [[2, 4, 1, 9]], expected: 8 },
        { label: "single element → 0", args: [[5]], expected: 0 },
        { label: "empty → 0", args: [[]], expected: 0 },
      ],
      skill: "dynamic-programming",
      explain:
        "Track the minimum price seen so far and the best profit against it. Both update in constant time per element, so the whole thing is one O(n) pass with O(1) memory.",
    },

    {
      id: "cq-routes",
      kind: "code",
      prompt: "Cheapest Execution Routes",
      description:
        "A venue graph is given as an object mapping each node to a list of { to, weight } edges, with all weights non-negative. Return an object mapping every node to the cheapest total cost of reaching it from the source. The source itself costs 0, and any node that cannot be reached costs -1.",
      functionName: "shortestCosts",
      starter: `function shortestCosts(graph, source) {
  // TODO: Dijkstra. Unreachable nodes must report -1, not Infinity.
  return {};
}`,
      tests: [
        {
          label: "relaxes through an intermediate node",
          args: [
            { A: [{ to: "B", weight: 1 }, { to: "C", weight: 4 }], B: [{ to: "C", weight: 2 }, { to: "D", weight: 5 }], C: [{ to: "D", weight: 1 }], D: [] },
            "A",
          ],
          expected: { A: 0, B: 1, C: 3, D: 4 },
        },
        {
          label: "unreachable nodes report -1",
          args: [{ A: [{ to: "B", weight: 2 }], B: [], C: [{ to: "A", weight: 1 }] }, "A"],
          expected: { A: 0, B: 2, C: -1 },
        },
        {
          label: "source only",
          args: [{ A: [] }, "A"],
          expected: { A: 0 },
        },
        {
          label: "prefers the cheaper multi-hop path",
          args: [
            { A: [{ to: "B", weight: 10 }, { to: "C", weight: 1 }], B: [], C: [{ to: "B", weight: 2 }] },
            "A",
          ],
          expected: { A: 0, B: 3, C: 1 },
        },
      ],
      skill: "data-structures",
      explain:
        "Dijkstra settles the cheapest unsettled node, then relaxes its edges. Because weights are non-negative, once a node is settled its cost is final. Reporting -1 rather than Infinity keeps the output JSON-representable.",
    },
  ];
}
