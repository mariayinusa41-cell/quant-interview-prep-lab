// Minimal Cloudflare Workers runtime types.
//
// @cloudflare/workers-types is not installed, so worker/index.ts has always
// failed typecheck on `Fetcher` and `D1Database`. Rather than add a
// dependency (and risk it disagreeing with the workerd version the build
// actually runs), this declares just the surface this project uses.
//
// These describe the real runtime API; if the code starts using more of D1
// than this covers, widen it here rather than reaching for `any`.

declare global {
  interface Fetcher {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
  }

  interface D1Result<T = Record<string, unknown>> {
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
    run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<{ count: number; duration: number }>;
  }

  /** Payload passed to a Worker's scheduled() handler by a Cron Trigger. */
  interface ScheduledController {
    scheduledTime: number;
    cron: string;
    noRetry(): void;
  }
}

export {};
