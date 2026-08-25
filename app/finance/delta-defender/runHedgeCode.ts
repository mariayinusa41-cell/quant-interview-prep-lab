"use client";

// Runs a player-written hedgeRatio(S, K, T, r, sigma, tick) function against
// a precomputed price path, once per tick, inside a sandboxed Web Worker —
// same isolation approach as Mini Task's runCode.ts (no DOM access, killed
// on timeout). The true Delta at each tick is computed OUTSIDE the sandbox
// by this app's own trusted Black-Scholes engine, never by the player's
// code, so there's no way a submitted function can fake a good score.

export type PathTick = { tick: number; S: number; T: number; r: number; sigma: number; K: number };
export type HedgeCallResult = { tick: number; hedgeRatio: number | null; error?: string };
export type HedgeRunResult = { results: HedgeCallResult[]; crashed: boolean; crashMessage?: string; timedOut?: boolean };

const WORKER_SOURCE = `
self.onmessage = function (e) {
  const { userCode, path } = e.data;
  const results = [];
  let crashed = false;
  let crashMessage = "";
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(userCode + "\\nreturn hedgeRatio;")();
    if (typeof fn !== "function") {
      throw new Error("No function named 'hedgeRatio' was found.");
    }
    for (const p of path) {
      try {
        const value = fn(p.S, p.K, p.T, p.r, p.sigma, p.tick);
        const num = typeof value === "number" && isFinite(value) ? value : null;
        results.push({ tick: p.tick, hedgeRatio: num, error: num === null ? "did not return a finite number" : undefined });
      } catch (err) {
        results.push({ tick: p.tick, hedgeRatio: null, error: String((err && err.message) || err) });
      }
    }
  } catch (err) {
    crashed = true;
    crashMessage = String((err && err.message) || err);
  }
  postMessage({ results, crashed, crashMessage });
};
`;

export function runHedgeAlgorithm(userCode: string, path: PathTick[], timeoutMs = 3000): Promise<HedgeRunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (result: HedgeRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ results: [], crashed: true, timedOut: true, crashMessage: "Timed out - check for an infinite loop." });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<HedgeRunResult>) => finish(e.data);
    worker.onerror = (e) => finish({ results: [], crashed: true, crashMessage: e.message || "Worker error" });

    worker.postMessage({ userCode, path });
  });
}
