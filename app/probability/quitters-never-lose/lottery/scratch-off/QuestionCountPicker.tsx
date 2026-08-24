import TokenPlayButton from "../../../../access/TokenPlayButton";

// Shared by the timed and not-timed pages — only the `timed` flag and the
// "back" link differ, so the picker itself lives in one place. This sets
// questions PER TICKET, not a session total — every ticket you buy gets its
// own fresh set of that many questions (and, if timed, its own fresh clock).

export default function QuestionCountPicker({ timed }: { timed: boolean }) {
  const suffix = timed ? "&timed=1" : "&timed=0";
  return (
    <div className="category-picker category-picker-centered">
      <TokenPlayButton gameId={`probability-scratch-${timed ? "timed" : "untimed"}-7`} title={`Scratch-Off, ${timed ? "timed" : "untimed"}, 7 questions`} href={`/probability/quitters-never-lose/lottery/scratch-off/play?perTicket=7${suffix}`} className="category-bubble">
        <span className="category-bubble-icon">7</span>
        7 Questions / Ticket
        {timed && <span className="category-bubble-sub">5:15 per ticket</span>}
      </TokenPlayButton>
      <TokenPlayButton gameId={`probability-scratch-${timed ? "timed" : "untimed"}-13`} title={`Scratch-Off, ${timed ? "timed" : "untimed"}, 13 questions`} href={`/probability/quitters-never-lose/lottery/scratch-off/play?perTicket=13${suffix}`} className="category-bubble">
        <span className="category-bubble-icon">13</span>
        13 Questions / Ticket
        {timed && <span className="category-bubble-sub">9:45 per ticket</span>}
      </TokenPlayButton>
    </div>
  );
}
