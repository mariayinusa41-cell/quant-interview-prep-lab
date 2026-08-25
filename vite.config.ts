import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";

// Real D1 database in the project's own Cloudflare account. This replaces
// the placeholder the OpenAI Sites control plane used to swap in at deploy
// time — we deploy straight to Cloudflare now, so the id has to be real
// here. Local `vinext dev` still runs against Miniflare's local SQLite and
// ignores this id entirely.
const DATABASE_ID = "c8a9b1cc-efc1-42a0-9623-ba7fdf236249";
const DATABASE_NAME = "outcry";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: DATABASE_NAME,
          database_id: DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
  // Daily news refresh. 06:15 UTC is deliberately off the hour: Cloudflare
  // schedules a great many crons at :00, and the third-party APIs this hits
  // are free public endpoints worth being unfashionable with.
  triggers: {
    crons: ["15 6 * * *"],
  },
  // Keep the *.workers.dev URL alive. Wrangler DISABLES it by default the
  // moment it is not explicitly set, which silently 404'd the live site on
  // a deploy that was only meant to add a custom domain. It stays on as a
  // permanent fallback so the site is never reachable only via DNS that
  // might still be propagating.
  workers_dev: true,
  // Custom domains are attached in the Cloudflare dashboard rather than
  // here. Declaring them as `routes` fails while the zone still holds the
  // A/CNAME records Cloudflare imported from the registrar
  // (error 100117: "already has externally managed DNS records"), and
  // removing those needs zone-edit permission this token does not have.
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        ...(isCodexSeatbeltSandbox ? { inspectorPort: false } : {}),
        config: localBindingConfig,
      }),
    ],
  };
});
