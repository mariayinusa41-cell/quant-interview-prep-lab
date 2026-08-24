import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the intro and quant interview study content", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Quant Interview Prep Lab/);
  assert.match(html, /Click anywhere to start/);
  assert.match(html, /flower-of-life-3d/);
  assert.match(html, /Open the Algorithm Arena/);
  assert.match(html, /Open the Readiness Audit/);
  assert.match(html, /Open the Gradient Lab/);
  assert.doesNotMatch(html, /Open the Stochastic Processes Lab/);
  assert.match(html, /Brain Teasers Lab/);
  assert.doesNotMatch(html, /Brain Teasers Arena|Spotlight \/\/|Reveal approach/);
  assert.doesNotMatch(html, /Chapter Study Map|Fast Reference|8-Week Prep Schedule/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("server-renders both new interview game labs", async () => {
  const [algorithms, calculus, audit] = await Promise.all([
    render("/algorithms"),
    render("/calculus-linear-algebra"),
    render("/audit"),
  ]);

  assert.equal(algorithms.status, 200);
  assert.equal(calculus.status, 200);
  assert.equal(audit.status, 200);
  assert.match(await algorithms.text(), /Algorithm Arena|Complexity|Monte Carlo|Python \/ pandas/);
  assert.match(await calculus.text(), /Gradient Lab|Taylor|Lagrange|PSD matrices/);
  assert.match(await audit.text(), /Readiness Audit|37 playable modes|Quant trading/);
});

test("source no longer depends on the starter preview", async () => {
  const [page, layout, packageJson, stochasticGame, stochasticMath, stochasticPage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/stochastic-processes/RuinWalkerGame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/stochastic-processes/stochasticMath.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/stochastic-processes/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Chapter 7 - Algorithms and Numerical Methods/);
  assert.match(page, /onClick={startLab}/);
  assert.match(page, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(layout, /Quant Interview Prep Lab/);
  assert.match(stochasticGame, /Ruin Walker/);
  assert.match(stochasticGame, /Volatile jump/);
  assert.match(stochasticGame, /Stop &amp; cash out/);
  assert.match(stochasticMath, /fairRuinProbability/);
  assert.match(stochasticMath, /expectedDuration/);
  assert.match(stochasticPage, /ruin-walker/);
  assert.match(stochasticPage, /Martingale Mutiny/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|codex-preview/);
});
