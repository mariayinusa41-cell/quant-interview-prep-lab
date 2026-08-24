"use client";

// Runs a candidate limit-order-book implementation in a Web Worker: first for
// correctness against a scripted message sequence, then for latency.
//
// The latency check is SELF-CALIBRATING. Rather than comparing against a
// fixed millisecond budget — which would mean different things on different
// machines, and would drift with JIT warm-up — it runs a reference O(1)
// implementation through the identical workload in the same worker and
// reports the candidate as a multiple of that. A machine being slow moves
// both numbers together and cancels out.

export type BookTrade = { price: number; qty: number; maker: string; taker: string };

export type CorrectnessCase = { label: string; passed: boolean; expected: string; actual: string };

export type BookRunResult = {
  cases: CorrectnessCase[];
  crashed: boolean;
  crashMessage?: string;
  timedOut?: boolean;
  /** Milliseconds for the candidate on the cancel-storm workload. */
  candidateMs?: number;
  /** Milliseconds for the reference O(1) engine on the same workload. */
  referenceMs?: number;
  /** candidateMs / referenceMs. */
  ratio?: number;
  latencyPassed?: boolean;
};

/** A candidate slower than this multiple of the reference fails the latency gate. */
export const LATENCY_BUDGET = 5;
const BENCH_ORDERS = 6000;
const BENCH_LEVELS = 20;

const WORKER_SOURCE = `
// ---- reference O(1) engine, used only as a latency baseline ----
function __refBook() {
  var levels = new Map(), index = new Map();
  return {
    add: function (id, p) {
      var o = { id: id, p: p, cancelled: false };
      if (!levels.has(p)) levels.set(p, []);
      levels.get(p).push(o); index.set(id, o);
    },
    cancel: function (id) {
      var o = index.get(id);
      if (!o || o.cancelled) return false;
      o.cancelled = true; index.delete(id); return true;
    }
  };
}

function __benchRef(M, LV) {
  var b = __refBook(), ids = [];
  for (var i = 0; i < M; i++) {
    var id = "o" + i; ids.push(id);
    b.add(id, (i % 2 ? 100 : 500) + (i % LV));
  }
  var t0 = performance.now();
  for (var j = ids.length - 1; j >= 0; j--) b.cancel(ids[j]);
  return performance.now() - t0;
}

// Bids sit far below asks so NOTHING crosses: the point is to build a deep
// resting book, and a matching engine would otherwise trade most of this
// away and leave almost nothing to cancel.
//
// Cancels run newest-first, which is the adversarial order for any
// implementation that locates an order by scanning a price level from the
// front — that scan, not the removal itself, is what costs O(N).
function __benchCandidate(make, M, LV) {
  var b = make(), ids = [];
  for (var i = 0; i < M; i++) {
    var id = "o" + i; ids.push(id);
    if (i % 2) b.add(id, "buy", 100 + (i % LV), 10);
    else b.add(id, "sell", 500 + (i % LV), 10);
  }
  var t0 = performance.now();
  for (var j = ids.length - 1; j >= 0; j--) b.cancel(ids[j]);
  return performance.now() - t0;
}

function __median(fn, n) {
  var xs = [];
  for (var i = 0; i < n; i++) xs.push(fn());
  xs.sort(function (a, b) { return a - b; });
  return xs[Math.floor(n / 2)];
}

self.onmessage = function (e) {
  var userCode = e.data.userCode;
  var script = e.data.script;
  var M = e.data.benchOrders, LV = e.data.benchLevels;
  var cases = [], crashed = false, crashMessage = "";
  var candidateMs, referenceMs, ratio, latencyPassed;

  try {
    var make = new Function(userCode + "\\nreturn createBook;")();
    if (typeof make !== "function") throw new Error("No function named 'createBook' was found.");

    // ---- correctness ----
    var book = make();
    for (var i = 0; i < script.length; i++) {
      var step = script[i];
      var actual;
      try {
        if (step.op === "add") actual = book.add(step.id, step.side, step.price, step.qty);
        else if (step.op === "cancel") actual = book.cancel(step.id);
        else if (step.op === "bestBid") actual = book.bestBid();
        else if (step.op === "bestAsk") actual = book.bestAsk();
        // Trades are compared on the fields that define a fill, in order, so
        // an implementation may carry extra bookkeeping fields of its own.
        var norm = Array.isArray(actual)
          ? actual.map(function (t) {
              return { price: t.price, qty: t.qty, maker: t.maker, taker: t.taker };
            })
          : actual;
        var a = JSON.stringify(norm === undefined ? null : norm);
        var x = JSON.stringify(step.expected);
        cases.push({ label: step.label, passed: a === x, expected: x, actual: a });
      } catch (err) {
        cases.push({
          label: step.label, passed: false,
          expected: JSON.stringify(step.expected),
          actual: "threw: " + String((err && err.message) || err)
        });
      }
    }

    // ---- latency, only if it actually works ----
    var allPassed = cases.every(function (c) { return c.passed; });
    if (allPassed) {
      // Warm the JIT so neither side is measured cold.
      __benchRef(1500, LV); __benchCandidate(make, 1500, LV);
      __benchRef(1500, LV); __benchCandidate(make, 1500, LV);

      referenceMs = __median(function () { return __benchRef(M, LV); }, 5);
      candidateMs = __median(function () { return __benchCandidate(make, M, LV); }, 5);
      ratio = candidateMs / Math.max(referenceMs, 0.001);
      latencyPassed = ratio <= e.data.budget;
    }
  } catch (err) {
    crashed = true;
    crashMessage = String((err && err.message) || err);
  }

  postMessage({
    cases: cases, crashed: crashed, crashMessage: crashMessage,
    candidateMs: candidateMs, referenceMs: referenceMs,
    ratio: ratio, latencyPassed: latencyPassed
  });
};
`;

export type ScriptStep = {
  op: "add" | "cancel" | "bestBid" | "bestAsk";
  label: string;
  id?: string;
  side?: "buy" | "sell";
  price?: number;
  qty?: number;
  expected: unknown;
};

export function runOrderBook(
  userCode: string,
  script: ScriptStep[],
  timeoutMs = 8000,
): Promise<BookRunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (result: BookRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        cases: [], crashed: true, timedOut: true,
        crashMessage: "Timed out. On this workload that usually means a cancel that scans the book.",
      });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<BookRunResult>) => finish(e.data);
    worker.onerror = (e) =>
      finish({ cases: [], crashed: true, crashMessage: e.message || "Worker error" });

    worker.postMessage({
      userCode, script,
      benchOrders: BENCH_ORDERS, benchLevels: BENCH_LEVELS,
      budget: LATENCY_BUDGET,
    });
  });
}
