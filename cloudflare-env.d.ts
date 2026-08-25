// Ambient declaration for the Workers runtime's env module.
//
// Deliberately its own file with no top-level import/export: a .d.ts that
// contains either becomes a module, and `declare module` inside a module is
// treated as augmenting an existing module rather than declaring a new one,
// which is why putting this next to the global interfaces did not work.
//
// db/index.ts has imported "cloudflare:workers" since before this change and
// failed typecheck on it; this fixes that too.

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    [key: string]: unknown;
  };
}
