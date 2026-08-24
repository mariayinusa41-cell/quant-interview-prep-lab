"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SESSION_ROUNDS, useAccess } from "./AccessContext";
import { useProfile } from "../profile/ProfileContext";

export function AccessPlayLabel({ gameId, defaultLabel = "Play" }: { gameId: string; defaultLabel?: string }) {
  const { mode, getRoundsRemaining, isFreeGame, isPremiumOnly, getSessionCost } = useAccess();
  const { profile } = useProfile();
  if (mode === "developer") return <span className="access-play-meta">{defaultLabel}</span>;
  if (mode === "infinity") return <span className="access-play-meta">Play unlimited</span>;
  if (isFreeGame(gameId)) return <span className="access-play-meta">Play free</span>;
  // Guests never hold tokens, so anything with a price is sign-up-gated.
  // Only meaningful in free mode: a pass holder necessarily has an account.
  if (profile.onboarded && profile.account === "guest") {
    return <span className="access-play-meta">Sign up to play</span>;
  }
  if (isPremiumOnly(gameId)) return <span className="access-play-meta">Infinity Pass only</span>;
  const roundsRemaining = getRoundsRemaining(gameId);
  if (roundsRemaining > 0) return <span className="access-play-meta">Use round ({roundsRemaining} left)</span>;
  return <span className="access-play-meta">Play for {getSessionCost(gameId)} tokens</span>;
}

type AccessStartButtonProps = {
  gameId: string;
  title?: string;
  defaultLabel?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onStart: () => void;
};

export function AccessStartButton({ gameId, title = "this game", defaultLabel = "Play", children, className, disabled = false, onStart }: AccessStartButtonProps) {
  const { mode, tokens, getRoundsRemaining, isFreeGame, isPremiumOnly, getSessionCost, startGameEntry } = useAccess();
  const { profile } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(false);
  const roundsRemaining = getRoundsRemaining(gameId);
  const cost = getSessionCost(gameId);
  // A guest has no wallet at all: only the always-free games are playable.
  // Scoped to free mode — someone holding a pass (or in developer mode) is by
  // definition not a guest, and must not be blocked by this.
  const guestBlocked =
    mode === "free" && profile.onboarded && profile.account === "guest" && !isFreeGame(gameId);
  const premiumBlocked = !guestBlocked && mode === "free" && isPremiumOnly(gameId);
  const requiresPurchase =
    !guestBlocked && mode === "free" && !isFreeGame(gameId) && !premiumBlocked && roundsRemaining === 0;

  const start = () => {
    if (premiumBlocked || guestBlocked) return false;
    if (startGameEntry(gameId)) {
      onStart();
      return true;
    }
    setError(true);
    return false;
  };

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => {
          setError(false);
          if (requiresPurchase || premiumBlocked || guestBlocked) setConfirmOpen(true);
          else start();
        }}
        aria-haspopup={requiresPurchase || premiumBlocked || guestBlocked ? "dialog" : undefined}
      >
        {children}
        <AccessPlayLabel gameId={gameId} defaultLabel={defaultLabel} />
      </button>

      {confirmOpen && (
        <div className="access-modal-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <section className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-modal-title" onClick={(event) => event.stopPropagation()}>
            {guestBlocked ? (
              <>
                <p className="label">Guest session</p>
                <h2 id="access-modal-title">Sign up to unlock this</h2>
                <p>
                  Guests can play the always-free games as much as they like. Tokens, paid sessions,
                  and the daily challenge need an account.
                </p>
                <div className="access-modal-actions">
                  <button type="button" className="access-modal-confirm" onClick={() => setConfirmOpen(false)}>Close</button>
                </div>
              </>
            ) : premiumBlocked ? (
              <>
                <p className="label">Infinity Pass content</p>
                <h2 id="access-modal-title">Infinity Pass required</h2>
                <p>{title} is not available through the Free user token wallet. This content is reserved for the Infinity Pass.</p>
                <div className="access-modal-actions">
                  <button type="button" className="access-modal-confirm" onClick={() => setConfirmOpen(false)}>Close</button>
                </div>
              </>
            ) : (
              <>
                <p className="label">Free user session</p>
                <h2 id="access-modal-title">Purchase {title}?</h2>
                <p>This uses {cost} tokens and gives you {SESSION_ROUNDS} rounds of {title}. Your current balance is {tokens} tokens.</p>
                {error && <p className="access-modal-error">You need at least {cost} tokens to start another session.</p>}
                <div className="access-modal-actions">
                  <button type="button" className="access-modal-cancel" onClick={() => setConfirmOpen(false)}>Cancel</button>
                  <button type="button" className="access-modal-confirm" onClick={() => { if (start()) setConfirmOpen(false); }}>
                    Purchase for {cost} tokens
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default function TokenPlayButton({ href, gameId, title, children, className }: { href: string; gameId: string; title?: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  return <AccessStartButton gameId={gameId} title={title} className={className} onStart={() => router.push(href)}>{children}</AccessStartButton>;
}
