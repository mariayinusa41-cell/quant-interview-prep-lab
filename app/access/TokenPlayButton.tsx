"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SESSION_ROUNDS, useAccess } from "./AccessContext";
import { useProfile } from "../profile/ProfileContext";

export function AccessPlayLabel({ gameId, defaultLabel = "Play" }: { gameId: string; defaultLabel?: string }) {
  const {
    mode,
    getRoundsRemaining,
    isFreeGame,
    isPremiumOnly,
    getSessionCost,
    getLifetimeCap,
    isLifetimeExhausted,
    getLifetimeGroupLabel,
  } = useAccess();
  const { profile } = useProfile();
  // Developer mode has no access state worth reporting — and every caller
  // already passes its own label as `children`, so echoing `defaultLabel`
  // here just rendered it twice ("STARTSTART", "SET SAILSET SAIL",
  // "Review Retail Banking...Open the review"). `defaultLabel` stays in the
  // signature because the paid/free branches below still need a sensible
  // fallback name for the game.
  if (mode === "developer") return null;
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
  // A lifetime-capped game reads as premium-only once used up, and as a
  // normal purchase (with a heads-up that it's a one-time unlock) before
  // that — so the cost is never a surprise.
  if (isLifetimeExhausted(gameId)) return <span className="access-play-meta">Infinity Pass only</span>;
  const cost = getSessionCost(gameId);
  const cap = getLifetimeCap(gameId);
  if (cap !== null) {
    const groupLabel = getLifetimeGroupLabel(gameId);
    const capText = cap === 1 ? "1 lifetime play" : `${cap} lifetime plays`;
    return (
      <span className="access-play-meta">
        Play for {cost} tokens ({groupLabel ? `${capText} across ${groupLabel}` : capText})
      </span>
    );
  }
  return <span className="access-play-meta">Play for {cost} tokens</span>;
}

type AccessStartButtonProps = {
  gameId: string;
  title?: string;
  defaultLabel?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  onStart: () => void;
};

export function AccessStartButton({ gameId, title = "this game", defaultLabel = "Play", children, className, style, disabled = false, onStart }: AccessStartButtonProps) {
  const {
    mode,
    tokens,
    getRoundsRemaining,
    isFreeGame,
    isPremiumOnly,
    getSessionCost,
    getLifetimeCap,
    isLifetimeExhausted,
    getLifetimeGroupLabel,
    startGameEntry,
  } = useAccess();
  const { profile } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(false);
  const roundsRemaining = getRoundsRemaining(gameId);
  const cost = getSessionCost(gameId);
  const lifetimeCap = getLifetimeCap(gameId);
  const lifetimeGroupLabel = getLifetimeGroupLabel(gameId);
  // A guest has no wallet at all: only the always-free games are playable.
  // Scoped to free mode — someone holding a pass (or in developer mode) is by
  // definition not a guest, and must not be blocked by this.
  const guestBlocked =
    mode === "free" && profile.onboarded && profile.account === "guest" && !isFreeGame(gameId);
  // A used-up lifetime play reads exactly like premium-only content from
  // here down: the modal and button state don't need to distinguish them,
  // only the copy inside the modal does.
  const lifetimeBlocked = !guestBlocked && mode === "free" && isLifetimeExhausted(gameId);
  const premiumBlocked = !guestBlocked && mode === "free" && (isPremiumOnly(gameId) || lifetimeBlocked);
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
        style={style}
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
            ) : lifetimeBlocked ? (
              <>
                <p className="label">Lifetime play used</p>
                <h2 id="access-modal-title">
                  {lifetimeGroupLabel ? `Your ${lifetimeGroupLabel} unlock is used` : "You've already played this one"}
                </h2>
                <p>
                  {lifetimeGroupLabel
                    ? `You already spent your one free lifetime play in ${lifetimeGroupLabel}. Every game in ${lifetimeGroupLabel} is Infinity Pass only from here.`
                    : `${title} was a one-time unlock for Free users, and you've used it.`}{" "}
                  It&rsquo;s still playable any time on the Infinity Pass.
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
                {lifetimeCap !== null && (
                  <p className="mm-step-hint">
                    {lifetimeGroupLabel ? (
                      <>
                        Heads up: as a Free user you get {lifetimeCap === 1 ? "one lifetime play across all of" : `${lifetimeCap} lifetime plays across`} {lifetimeGroupLabel} — starting {title} uses it, and every other {lifetimeGroupLabel} game becomes Infinity Pass only right after, whether you've tried it or not.
                      </>
                    ) : (
                      <>
                        Heads up: as a Free user this is a one-time unlock — {lifetimeCap === 1 ? "this is your only lifetime play" : `you get ${lifetimeCap} lifetime plays`} of {title}. After that it's Infinity Pass only.
                      </>
                    )}
                  </p>
                )}
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
