"use client";

import { useEffect, useState } from "react";

// The real signed-in indicator — separate from AccessModePicker's
// Guest/Signed-in toggle below, which is a local-only preview tool for
// trying out the product tiers and doesn't touch the database. This one
// calls the actual /api/auth/me route.

type Me = { id: number; email: string } | null;

export default function AccountBadge() {
  const [me, setMe] = useState<Me>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: Me }) => setMe(data.user ?? null))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  if (me) {
    return (
      <a href="/login" className="hub-account-badge" title="Manage account">
        {me.email}
      </a>
    );
  }

  return (
    <a href="/login" className="hub-account-badge is-guest">
      Log in
    </a>
  );
}
