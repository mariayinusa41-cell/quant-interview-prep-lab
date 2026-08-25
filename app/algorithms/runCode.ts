"use client";

// Runs user-submitted JavaScript against a set of test cases inside a Web
// Worker — isolated from the main thread (no DOM access, can't touch the
// rest of the page) and killable on a timeout, which is what actually
// matters for "arbitrary code a stranger typed into a textarea": it can't
// hang the page, and it can't reach anything outside its own sandbox. This
// is deliberately not a full IDE/judge — no filesystem, no network, no
// persistence — just enough to check whether a function returns the right
// values.

export type TestCase = { args: unknown[]; expected: unknown; label: string };
export type TestResult = { label: string; passed: boolean; actual?: unknown; error?: string };
export type RunResult = { results: TestResult[]; crashed: boolean; crashMessage?: string; timedOut?: boolean };

const WORKER_SOURCE = `
self.onmessage = function (e) {
  const { userCode, functionName, testCases } = e.data;
  const results = [];
  let crashed = false;
  let crashMessage = "";
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(userCode + "\\nreturn " + functionName + ";")();
    if (typeof fn !== "function") {
      throw new Error("No function named '" + functionName + "' was found.");
    }
    for (const tc of testCases) {
      try {
        const actual = fn.apply(null, tc.args);
        const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
        results.push({ label: tc.label, passed, actual });
      } catch (err) {
        results.push({ label: tc.label, passed: false, error: String((err && err.message) || err) });
      }
    }
  } catch (err) {
    crashed = true;
    crashMessage = String((err && err.message) || err);
  }
  postMessage({ results, crashed, crashMessage });
};
`;

export function runTests(
  userCode: string,
  functionName: string,
  testCases: TestCase[],
  timeoutMs = 3000
): Promise<RunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ results: [], crashed: true, timedOut: true, crashMessage: "Timed out - likely an infinite loop or an approach too slow for the input size." });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<RunResult>) => finish(e.data);
    worker.onerror = (e) => finish({ results: [], crashed: true, crashMessage: e.message || "Worker error" });

    worker.postMessage({ userCode, functionName, testCases });
  });
}
