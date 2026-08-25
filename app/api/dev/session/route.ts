import { env } from "cloudflare:workers";
import {
  clearDevCookieHeader,
  createDevCookie,
  isDevConfigured,
  isDeveloperRequest,
} from "../../../../lib/devAuth";

const asEnv = () => env as unknown as Record<string, unknown>;

/** GET — is this request from a signed-in developer? */
export async function GET(request: Request) {
  const isDeveloper = await isDeveloperRequest(request, asEnv());
  // `configured` lets the sign-in page explain "no developer credentials are
  // set on this deployment" instead of just rejecting every attempt.
  return Response.json({ isDeveloper, configured: isDevConfigured(asEnv()) });
}

/** POST — exchange developer credentials for a signed cookie. */
export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!isDevConfigured(asEnv())) {
    return Response.json(
      { error: "Developer access is not configured on this deployment." },
      { status: 503 },
    );
  }

  const cookie = await createDevCookie(asEnv(), username, password);
  if (!cookie) {
    // One message for a wrong username and a wrong password alike, so this
    // cannot be used to discover the username.
    return Response.json({ error: "Those credentials were not accepted." }, { status: 401 });
  }

  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}

/** DELETE — drop developer access. */
export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearDevCookieHeader() } });
}
