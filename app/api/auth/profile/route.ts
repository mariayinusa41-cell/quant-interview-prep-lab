import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getCurrentUser } from "../../../../lib/auth";
import { TRACKS } from "../../../../app/profile/tracks";
import { AVATARS } from "../../../../app/profile/avatars";
import { AGE_BANDS, EXPERIENCE_LEVELS, MAJORS } from "../../../../app/profile/tracks";

// Account-level personalization, so avatar/tracks/major follow the account
// across devices instead of living in one browser's localStorage.
//
// Every field is validated against the same catalogues the UI renders from —
// a request naming an avatar or track that doesn't exist is a 400, not a row
// of junk that every later reader has to defend against.

const AVATAR_IDS = new Set(AVATARS.map((a) => a.id as string));
const TRACK_IDS = new Set(TRACKS.map((t) => t.id as string));
const MAJOR_SET = new Set(MAJORS as readonly string[]);
const EXPERIENCE_SET = new Set(EXPERIENCE_LEVELS as readonly string[]);
const AGE_SET = new Set(AGE_BANDS as readonly string[]);

export async function PATCH(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });

  let payload: {
    displayName?: unknown;
    avatar?: unknown;
    tracks?: unknown;
    major?: unknown;
    experience?: unknown;
    ageBand?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const patch: Record<string, string | null> = {};

  if (payload.displayName !== undefined) {
    if (typeof payload.displayName !== "string" || payload.displayName.length > 60) {
      return Response.json({ error: "Display name must be at most 60 characters." }, { status: 400 });
    }
    patch.displayName = payload.displayName.trim() || null;
  }

  if (payload.avatar !== undefined) {
    if (typeof payload.avatar !== "string" || !AVATAR_IDS.has(payload.avatar)) {
      return Response.json({ error: "Unknown avatar." }, { status: 400 });
    }
    patch.avatar = payload.avatar;
  }

  if (payload.tracks !== undefined) {
    if (
      !Array.isArray(payload.tracks) ||
      payload.tracks.some((t) => typeof t !== "string" || !TRACK_IDS.has(t))
    ) {
      return Response.json({ error: "Unknown track." }, { status: 400 });
    }
    patch.tracksJson = JSON.stringify([...new Set(payload.tracks)]);
  }

  // The three "about you" fields are optional everywhere else, so an empty
  // string is a deliberate "clear it", stored as null.
  const enumField = (
    key: "major" | "experience" | "ageBand",
    column: string,
    allowed: Set<string>,
  ): Response | null => {
    const value = payload[key];
    if (value === undefined) return null;
    if (typeof value !== "string" || (value !== "" && !allowed.has(value))) {
      return Response.json({ error: `Unknown ${key}.` }, { status: 400 });
    }
    patch[column] = value || null;
    return null;
  };

  const bad =
    enumField("major", "major", MAJOR_SET) ??
    enumField("experience", "experience", EXPERIENCE_SET) ??
    enumField("ageBand", "ageBand", AGE_SET);
  if (bad) return bad;

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.update(users).set(patch).where(eq(users.id, me.id));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not save the profile." }, { status: 500 });
  }
}
