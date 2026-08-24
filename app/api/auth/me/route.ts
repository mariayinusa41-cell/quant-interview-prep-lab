import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    return Response.json({ user });
  } catch {
    // If the tables aren't migrated yet, treat it as "no session" rather
    // than a 500 — this route gets polled on every page load, so it should
    // fail quiet, not loud.
    return Response.json({ user: null });
  }
}
