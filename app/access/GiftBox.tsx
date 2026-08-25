"use client";

import { useEffect, useState } from "react";
import { useAccess } from "./AccessContext";
import GiftIcon from "./GiftIcon";

// A one-time welcome reward for real, verified accounts — sits right next
// to the player's name once they've verified their email and haven't
// claimed it yet. The claim itself is checked server-side (see
// app/api/auth/claim-welcome-bonus/route.ts) so it can't be re-triggered by
// clearing localStorage; the 100 tokens are then credited the same way
// every other token grant on this site works, through AccessContext.

type Me = {
  emailVerified: boolean;
  welcomeBonusClaimed: boolean;
} | null;

type Status = "checking" | "hidden" | "available" | "claiming" | "opened" | "error";

export default function GiftBox() {
  const { grantTokens } = useAccess();
  const [status, setStatus] = useState<Status>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: Me }) => {
        const user = data.user;
        if (user && user.emailVerified && !user.welcomeBonusClaimed) {
          setStatus("available");
        } else {
          setStatus("hidden");
        }
      })
      .catch(() => setStatus("hidden"));
  }, []);

  const open = async () => {
    setStatus("claiming");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/claim-welcome-bonus", { method: "POST", credentials: "same-origin" });
      const data = (await res.json()) as { claimed?: boolean; tokens?: number; error?: string };
      if (!res.ok || !data.claimed) {
        setErrorMsg(data.error ?? "Couldn't open it - try again.");
        setStatus("available");
        return;
      }
      grantTokens(data.tokens ?? 100);
      setStatus("opened");
    } catch {
      setErrorMsg("Network error - try again.");
      setStatus("available");
    }
  };

  if (status === "checking" || status === "hidden") return null;

  if (status === "opened") {
    return <span className="gift-box is-opened">+100 tokens!</span>;
  }

  return (
    <button
      type="button"
      className="gift-box"
      onClick={open}
      disabled={status === "claiming"}
      title="A welcome gift for verifying your email"
    >
      <GiftIcon className="gift-box-icon" />
      {status === "claiming" ? "Opening..." : "Open gift"}
      {errorMsg && <span className="gift-box-error">{errorMsg}</span>}
    </button>
  );
}
