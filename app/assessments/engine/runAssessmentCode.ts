"use client";

import type { CodeTest, PerfSpec } from "./types";

// Runs a candidate's submission for a code item inside a Web Worker: hidden
// test cases first, then — only if every test passes — an optional
// performance gate.
//
// The gate is self-calibrating for the same reason the order-book benchmark
// is: a fixed millisecond budget would mean different things on different
// machines and would drift with JIT warm-up. Instead a reference
// implementation runs the identical workload in the same worker, and the
// candidate is reported as a multiple of it.

export type CodeCaseResult = { label: string; passed: boolean; error?: string };

export type CodeRunResult = {
  cases: CodeCaseResult[];
  crashed: boolean;
  crashMessage?: string;
  timedOut?: boolean;
  candidateMs?: number;
  referenceMs?: number;
  ratio?: number;
  perfPassed?: boolean;
  /** All tests green, and the perf gate cleared when one exists. */
  solved: boolean;
};

const WORKER_SOURCE = `
function __median(fn, n) {
  var xs = [];
  for (var i = 0; i < n; i++) xs.push(fn());
  xs.sort(function (a, b) { return a - b; });
  return xs[Math.floor(n / 2)];
}

self.onmessage = function (e) {
  var d = e.data;
  var cases = [], crashed = false, crashMessage = "";
  var candidateMs, referenceMs, ratio, perfPassed;

  try {
    var fn = new Function(d.userCode + "\\nreturn " + d.functionName + ";")();
    if (typeof fn !== "function") {
      throw new Error("No function named '" + d.functionName + "' was found.");
    }

    // ---- hidden test cases ----
    for (var i = 0; i < d.tests.length; i++) {
      var tc = d.tests[i];
      try {
        if (tc.script) {
          // Stateful: build the object, then walk the call script. The first
          // mismatch fails the case and names the offending call.
          var obj = fn.apply(null, tc.ctor || []);
          var ok = true, detail = "";
          for (var k = 0; k < tc.script.length; k++) {
            var step = tc.script[k];
            var got = obj[step.call].apply(obj, step.args || []);
            if (Object.prototype.hasOwnProperty.call(step, "expect")) {
              if (JSON.stringify(got) !== JSON.stringify(step.expect)) {
                ok = false;
                detail = step.call + "(" + (step.args || []).join(", ") + ") returned " +
                  JSON.stringify(got) + ", expected " + JSON.stringify(step.expect);
                break;
              }
            }
          }
          cases.push({ label: tc.label, passed: ok, error: ok ? undefined : detail });
        } else {
          var actual = fn.apply(null, tc.args || []);
          cases.push({
            label: tc.label,
            passed: JSON.stringify(actual) === JSON.stringify(tc.expected),
          });
        }
      } catch (err) {
        cases.push({ label: tc.label, passed: false, error: String((err && err.message) || err) });
      }
    }

    // ---- performance, only when the thing actually works ----
    var allPassed = cases.length > 0 && cases.every(function (c) { return c.passed; });
    if (allPassed && d.perf) {
      var refFn = new Function(d.perf.reference + "\\nreturn " + d.functionName + ";")();
      var bench = new Function(d.perf.bench + "\\nreturn __bench;")();

      // Warm both sides so neither is measured cold.
      bench(refFn); bench(fn); bench(refFn); bench(fn);

      referenceMs = __median(function () { return bench(refFn); }, 5);
      candidateMs = __median(function () { return bench(fn); }, 5);
      ratio = candidateMs / Math.max(referenceMs, 0.001);
      perfPassed = ratio <= d.perf.budget;
    }
  } catch (err) {
    crashed = true;
    crashMessage = String((err && err.message) || err);
  }

  postMessage({
    cases: cases, crashed: crashed, crashMessage: crashMessage,
    candidateMs: candidateMs, referenceMs: referenceMs,
    ratio: ratio, perfPassed: perfPassed
  });
};
`;

export function runAssessmentCode(
  userCode: string,
  functionName: string,
  tests: CodeTest[],
  perf?: PerfSpec,
  timeoutMs = 12000,
): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (raw: Omit<CodeRunResult, "solved">) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      const allPassed = raw.cases.length > 0 && raw.cases.every((c) => c.passed);
      resolve({ ...raw, solved: allPassed && (perf ? raw.perfPassed === true : true) });
    };

    const timer = setTimeout(() => {
      finish({
        cases: [], crashed: true, timedOut: true,
        crashMessage: "Timed out. On this input size that usually means the approach is too slow.",
      });
    }, timeoutMs);

    worker.onmessage = (ev: MessageEvent<Omit<CodeRunResult, "solved">>) => finish(ev.data);
    worker.onerror = (ev) =>
      finish({ cases: [], crashed: true, crashMessage: ev.message || "Worker error" });

    worker.postMessage({ userCode, functionName, tests, perf });
  });
}
