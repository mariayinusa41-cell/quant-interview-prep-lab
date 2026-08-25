"use client";

import { useRouter } from "next/navigation";
import { AccessStartButton } from "../../../../access/TokenPlayButton";

// Shared by the timed and not-timed pages — only the `timed` flag and the
// "back" link differ, so the picker itself lives in one place. This sets
// questions PER TICKET, not a session total — every ticket you buy gets its
// own fresh set of that many questions (and, if timed, its own fresh clock).

// Handshake with ScratchOffGame: clicking through here charges for the
// session, which pays for the FIRST ticket. We leave a one-shot marker so
// the game knows not to charge again for that first ticket, and the game
// clears it the moment it's used. It lives in sessionStorage rather than a
// ref inside the game because a ref resets on reload — which would have
// handed out a fresh free ticket on every refresh.
export function scratchEntryKey(gameId: string) {
  return `scratch_entry_paid_${gameId}`;
}

export default function QuestionCountPicker({ timed }: { timed: boolean }) {
  const router = useRouter();
  const suffix = timed ? "&timed=1" : "&timed=0";
  const label = timed ? "timed" : "untimed";

  const enter = (gameId: string, href: string) => {
    try {
      window.sessionStorage.setItem(scratchEntryKey(gameId), "1");
    } catch {
      /* private-mode / storage disabled: the game just charges for ticket 1 */
    }
    router.push(href);
  };

  const options = [
    { count: 7 as const, sub: "5:15 per ticket" },
    { count: 13 as const, sub: "9:45 per ticket" },
  ];

  return (
    <div className="category-picker category-picker-centered">
      {options.map(({ count, sub }) => {
        const gameId = `probability-scratch-${label}-${count}`;
        const href = `/probability/quitters-never-lose/lottery/scratch-off/play?perTicket=${count}${suffix}`;
        return (
          <AccessStartButton
            key={count}
            gameId={gameId}
            title={`Scratch-Off, ${label}, ${count} questions`}
            className="category-bubble"
            onStart={() => enter(gameId, href)}
          >
            <span className="category-bubble-icon">{count}</span>
            {count} Questions / Ticket
            {timed && <span className="category-bubble-sub">{sub}</span>}
          </AccessStartButton>
        );
      })}
    </div>
  );
}
