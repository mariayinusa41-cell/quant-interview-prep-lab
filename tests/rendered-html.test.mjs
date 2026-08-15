import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Quant Interview Prep Lab/);
  assert.match(html, /Click anywhere to start/);
  assert.match(html, /fibonacci-flower/);
  assert.match(html, /Chapter 4 - Probability Theory/);
  assert.match(html, /Chapter 6 - Finance/);
  assert.match(html, /8-Week Prep Schedule/);
  assert.match(html, /Practice Prompts/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("source no longer depends on the starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Chapter 7 - Algorithms and Numerical Methods/);
  assert.match(page, /onClick={startLab}/);
  assert.match(page, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(layout, /Quant Interview Prep Lab/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|codex-preview/);
});
