"use client";

import { useEffect, useState, type CSSProperties } from "react";

// 8-wide x 10-tall pixel-art pirate bust.
// 0 empty, 1 hat/bandana, 2 skin, 3 outline/eyepatch, 4 eye, 5 body, 6 gold trim
const PIRATE_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [3, 2, 3, 2, 2, 4, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [0, 3, 2, 2, 2, 2, 3, 0],
  [0, 0, 5, 5, 5, 5, 0, 0],
  [0, 5, 5, 6, 6, 5, 5, 0],
  [0, 5, 5, 5, 5, 5, 5, 0],
];

const pirates = [
  { rank: 1, title: "Senior", hat: "#e74c4c", body: "#7a2323", skin: "#6b4226", senior: true },
  { rank: 2, title: "2nd", hat: "#f0a53b", body: "#7a4a12", skin: "#3d2317", senior: false },
  { rank: 3, title: "3rd", hat: "#4fb3e0", body: "#1c5a78", skin: "#e3b287", senior: false },
  { rank: 4, title: "4th", hat: "#59c98f", body: "#1f6b48", skin: "#8d5524", senior: false },
  { rank: 5, title: "Junior", hat: "#b98bff", body: "#5a3b8f", skin: "#f0c8a0", senior: false },
];

// Illustrative example votes for the two outcomes the rules explainer walks through.
// Pass: 3 of 5 (the minimum majority) agree, including the proposer himself.
const PASS_VOTES: Record<number, boolean> = { 1: true, 2: true, 3: true, 4: false, 5: false };
// Fail: only 2 of 5 agree, short of the 3-vote majority.
const FAIL_VOTES: Record<number, boolean> = { 1: true, 2: true, 3: false, 4: false, 5: false };
// Arbitrary example split the proposer used to buy the two extra votes he needed.
const GOLD_SPLIT: Record<number, number> = { 1: 96, 2: 2, 3: 2, 4: 0, 5: 0 };

function PixelPirate({
  hat,
  body,
  skin,
  senior,
  grayedOut,
}: {
  hat: string;
  body: string;
  skin: string;
  senior: boolean;
  grayedOut: boolean;
}) {
  const outline = "#1a1410";
  const eye = "#f4f0e8";
  const gold = "#f4c542";

  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return hat;
      case 2:
        return skin;
      case 3:
        return outline;
      case 4:
        return eye;
      case 5:
        return body;
      case 6:
        return senior ? gold : body;
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 8 10"
      className={grayedOut ? "pixel-pirate-svg is-grayed" : "pixel-pirate-svg"}
      shapeRendering="crispEdges"
    >
      {PIRATE_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

// 10-wide x 9-tall pixel-art treasure chest.
// 0 empty, 3 outline, 5 wood, 6 gold
const CHEST_GRID = [
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
  [3, 6, 6, 6, 6, 6, 6, 6, 6, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 6, 6, 6, 6, 5, 5, 3],
  [3, 5, 5, 6, 3, 3, 6, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [3, 5, 5, 5, 5, 5, 5, 5, 5, 3],
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
];

// 14-wide x 7-tall pixel-art shark, side profile.
// 0 empty, 1 body, 2 belly, 3 outline/eye, 4 teeth
const SHARK_GRID = [
  [0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 1, 1, 3, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 3, 0],
  [0, 4, 0, 4, 0, 4, 0, 4, 0, 3, 1, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Deterministic pseudo-random in [0, 1), seeded by tile position.
// (Plain Math.random() would differ between the server render and the
// client hydration pass and trigger a hydration mismatch.)
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function PixelChest({ splitting }: { splitting: boolean }) {
  const outline = "#241407";
  const wood = "#8a5a2b";
  const gold = "#f4c542";

  const colorFor = (code: number) => {
    switch (code) {
      case 3:
        return outline;
      case 5:
        return wood;
      case 6:
        return gold;
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 10 9"
      className={splitting ? "pixel-chest-svg is-splitting" : "pixel-chest-svg"}
      shapeRendering="crispEdges"
    >
      {CHEST_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          const h1 = hash(x, y);
          const h2 = hash(x + 1, y + 5);
          const angle = h1 * Math.PI * 2;
          const dist = 4.5 + h2 * 5.5;
          const tx = Math.cos(angle) * dist;
          const ty = Math.sin(angle) * dist;
          const tr = (h1 - 0.5) * 200;
          return (
            <rect
              key={`${x}-${y}`}
              className="chest-tile"
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
              style={
                {
                  "--tx": `${tx}px`,
                  "--ty": `${ty}px`,
                  "--tr": `${tr}deg`,
                  animationDelay: `${h1 * 0.15}s`,
                } as CSSProperties
              }
            />
          );
        })
      )}
    </svg>
  );
}

function PixelShark() {
  const body = "#3f6d8e";
  const belly = "#cfe3ee";
  const outline = "#12222c";
  const teeth = "#f6f8fa";

  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return body;
      case 2:
        return belly;
      case 3:
        return outline;
      case 4:
        return teeth;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 14 7" className="pixel-shark-svg" shapeRendering="crispEdges">
      {SHARK_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const BLOOD_DOTS = Array.from({ length: 16 }, (_, i) => {
  const h1 = hash(i + 20, 1);
  const h2 = hash(i + 7, 9);
  const h3 = hash(i + 13, 4);
  const angle = h1 * Math.PI * 2;
  const dist = 10 + h2 * 30;
  return {
    tx: Math.cos(angle) * dist,
    ty: Math.sin(angle) * dist - 8,
    delay: h1 * 0.25,
    size: 4 + h3 * 7,
  };
});

const PIRATE_STEP = 0.14;
const SPLIT_DURATION = 1700;

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// How long to hold on each phase before auto-advancing to the next one.
// Relative (not absolute-from-mount) so that skipping ahead just cancels the
// current wait and starts the next one fresh — nothing gets out of sync.
const HOLD_AFTER: Record<Exclude<Phase, 13>, number> = {
  0: 700, // pirates start popping in, large and centered
  1: pirates.length * PIRATE_STEP * 1000 + 750, // after they've all appeared and held
  2: 900, // pirates settled in the corner, chest appears
  3: 900, // let the second story line land, then split the chest
  4: SPLIT_DURATION + 150, // split animation, then it's back together
  5: 1200, // once it's settled to the side, clear the board
  6: 1500, // pirates return to center, proposer gets a star
  7: 1400, // first vote is cast (3 yes, 2 no)
  8: 1700, // majority reached, gold split, celebration
  9: 3000, // reset, second vote is cast (2 yes, 3 no)
  10: 1700, // short of majority, shark
  11: 3200, // the process repeats, next senior proposes
  12: 2600, // everything returns to the corners, board cleared
};

const CAPTIONS: Partial<Record<Phase, string>> = {
  7: "The most senior pirate proposes a split.",
  8: "At least 50% must vote yes - with five pirates, that's three.",
  9: "3 of 5 clears the 50% bar. Approved - no one walks the plank.",
  10: "If the 50% bar isn't cleared instead:",
  11: "Rejected. The senior pirate is fed to the sharks.",
  12: "The process repeats with the next most senior pirate - recalculating 50% each time, until it's finally met.",
};

const SHIFT_STEP_PX = 116; // pirate slot width (88px) + row gap (28px)
const RANK_TITLES = ["Senior", "2nd", "3rd", "4th"];

// Closing assumptions, shown one at a time after everything else has settled.
// The pirates and chest do not move again during this — text only.
const ASSUMPTIONS = [
  "You can assume all pirates are perfectly rational.",
  "They want to stay alive first, and get as much gold as possible second.",
  "Finally, being bloodthirsty pirates, they want to have fewer pirates on the boat if given a choice between otherwise equal outcomes.",
];
const FINAL_QUESTION = "How will the gold be divided?";

// Each step is either a line fading in (odd) or fading out (even); the final
// step (the question) fades in and stays — no exit. Relative holds again, for
// the same skip-safety reason as HOLD_AFTER above.
const HOLD_MS = 2800;
const FADE_MS = 650;
const EPILOGUE_START_DELAY = 1200; // after settling, before the first line appears
const EPILOGUE_HOLD_AFTER: Record<number, number> = {
  1: HOLD_MS,
  2: FADE_MS,
  3: HOLD_MS,
  4: FADE_MS,
  5: HOLD_MS,
  6: FADE_MS,
};

export default function PirateStory() {
  const [phase, setPhase] = useState<Phase>(0);
  const [rosterShifted, setRosterShifted] = useState(false);
  const [epilogueStep, setEpilogueStep] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // Each phase schedules only the next step, relative to itself — so
    // skipping (an out-of-band setPhase call) naturally cancels this timer
    // via the effect cleanup and starts a fresh one from wherever we land.
    if (phase >= 13) return;
    const delay = HOLD_AFTER[phase];
    const t = window.setTimeout(() => setPhase((p) => (p >= 13 ? p : ((p + 1) as Phase))), delay);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    // At phase 12 the eaten pirate drops out of the lineup and the rest of
    // the crew should visibly step forward to close the gap — so mount the
    // shorter roster one frame first, then trigger the slide on the next tick.
    // This is a one-way trip: phases only advance forward here, so once the
    // roster has shifted it should stay shifted (never reset to false).
    if (phase === 12) {
      const t = window.setTimeout(() => setRosterShifted(true), 60);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    // Starts the closing-assumptions sequence once everything has settled.
    if (phase !== 13 || epilogueStep !== 0) return;
    const t = window.setTimeout(() => setEpilogueStep(1), EPILOGUE_START_DELAY);
    return () => window.clearTimeout(t);
  }, [phase, epilogueStep]);

  useEffect(() => {
    // Same relative-chain, skip-safe pattern as the main phase schedule above.
    const delay = EPILOGUE_HOLD_AFTER[epilogueStep];
    if (!delay) return;
    const t = window.setTimeout(() => setEpilogueStep((s) => s + 1), delay);
    return () => window.clearTimeout(t);
  }, [epilogueStep]);

  useEffect(() => {
    // Let the question finish fading in (its own 0.65s transition) before the
    // continue button appears underneath it.
    if (epilogueStep === 7) {
      const t = window.setTimeout(() => setShowContinue(true), 700);
      return () => window.clearTimeout(t);
    }
  }, [epilogueStep]);

  const canSkip = phase < 13 || (epilogueStep > 0 && epilogueStep < 7);
  const handleSkip = () => {
    if (phase < 13) {
      setPhase((p) => (p >= 13 ? p : ((p + 1) as Phase)));
    } else if (epilogueStep > 0 && epilogueStep < 7) {
      setEpilogueStep((s) => s + 1);
    }
  };

  const piratesInCorner = (phase >= 2 && phase < 7) || phase >= 13;
  const chestToSide = phase >= 5;
  // Once the intro lines are cleared at phase 6, they stay cleared — the rules
  // explainer (phases 7-12) uses the caption slot instead, not these two lines.
  const boardCleared = phase >= 6;
  const caption = CAPTIONS[phase];

  const votingPass = phase === 8 || phase === 9;
  const votingFail = phase === 10 || phase === 11;
  const showProposer = phase >= 7 && phase < 13;
  const showGold = phase === 9;
  const showCelebrate = phase === 9;
  const showEaten = phase === 11;
  // Once the process repeats, the eaten senior drops off the front of the
  // line and everyone else steps forward to take the next rank.
  const activeRoster = phase >= 12 ? pirates.slice(1) : pirates;

  // Closing assumptions: fade in, hold, fade out, one at a time — the final
  // question (step 7) fades in and stays.
  const epilogueVisible = epilogueStep === 1 || epilogueStep === 3 || epilogueStep === 5 || epilogueStep === 7;
  const isFinalQuestion = epilogueStep >= 7;
  const epilogueText =
    epilogueStep <= 2
      ? ASSUMPTIONS[0]
      : epilogueStep <= 4
        ? ASSUMPTIONS[1]
        : epilogueStep <= 6
          ? ASSUMPTIONS[2]
          : FINAL_QUESTION;

  return (
    <div className="pirate-stage-content">
      {canSkip && (
        <button type="button" className="skip-btn" onClick={handleSkip}>
          Skip &raquo;
        </button>
      )}

      <p className={boardCleared ? "pirate-kicker board-cleared" : "pirate-kicker"}>Screwy Pirates</p>

      <p
        className={
          boardCleared ? "pirate-story-line pirate-enter board-cleared" : "pirate-story-line pirate-enter"
        }
        style={{ animationDelay: "0s" }}
      >
        Five pirates looted a chest of a hundred gold coins.
      </p>

      <div className="pirate-scene-slot" />

      {caption && (
        <div className="vote-caption-fixed">
          <p key={phase} className="pirate-story-line pirate-enter vote-caption" style={{ animationDelay: "0s" }}>
            {caption}
          </p>
        </div>
      )}

      {epilogueStep > 0 && (
        <div className="vote-caption-fixed">
          <p
            className={
              isFinalQuestion ? "pirate-story-line vote-caption final-question" : "pirate-story-line vote-caption"
            }
            style={{ opacity: epilogueVisible ? 1 : 0 }}
          >
            {epilogueText}
          </p>

          {showContinue && (
            <a href="/brain-teasers/screwy-pirates/answer" className="continue-btn pirate-enter">
              Click to continue
            </a>
          )}
        </div>
      )}

      <p
        className={
          phase >= 3
            ? boardCleared
              ? "pirate-story-line pirate-enter board-cleared"
              : "pirate-story-line pirate-enter"
            : "pirate-story-line pirate-story-hidden"
        }
        style={{ animationDelay: "0.35s" }}
      >
        Being a famously democratic crew, they agreed on a plan to split the loot.
      </p>

      {phase >= 3 && (
        <div className={chestToSide ? "chest-fixed-group in-side" : "chest-fixed-group"}>
          <div className="pirate-chest-wrap pirate-chest-enter">
            <PixelChest splitting={phase === 4} />
          </div>
        </div>
      )}

      {phase >= 1 && (
        <div className={piratesInCorner ? "pirate-fixed-group in-corner" : "pirate-fixed-group"}>
          <div className="pirate-lineup">
            {activeRoster.map((pirate, index) => {
              const votedYes = votingPass ? PASS_VOTES[pirate.rank] : votingFail ? FAIL_VOTES[pirate.rank] : null;
              const grayedOut = votedYes === false;
              const isEatenNow = showEaten && pirate.senior;

              // After the reshuffle, rank and "who's the proposer" are based on
              // the pirate's new position in line, not their original number.
              const isShifting = phase >= 12;
              const displayRank = isShifting ? index + 1 : pirate.rank;
              const displayTitle = isShifting ? RANK_TITLES[index] : pirate.title;
              // The gold belt marks "whoever is senior right now" — the
              // original #1 throughout, or the new front pirate after the shift.
              const isSeniorLook = isShifting ? index === 0 : pirate.senior;
              // The star only shows once we're actually in the proposal/vote
              // walkthrough (not during the opening chest story).
              const isProposerNow = isShifting ? index === 0 : showProposer && pirate.senior;

              // .pirate-enter's keyframe animation holds its own `transform`
              // via fill-mode forwards, which would otherwise fight the
              // inline slide transform below — drop it once we're shifting.
              const slotClassName = isShifting
                ? "pirate-slot"
                : isEatenNow
                  ? "pirate-slot pirate-enter is-eaten"
                  : showCelebrate
                    ? "pirate-slot pirate-enter is-celebrating"
                    : "pirate-slot pirate-enter";

              return (
                <div
                  className={slotClassName}
                  style={{
                    animationDelay: `${index * PIRATE_STEP}s`,
                    transform: isShifting ? `translateX(${rosterShifted ? 0 : SHIFT_STEP_PX}px)` : undefined,
                    transition: isShifting ? "transform 0.7s cubic-bezier(0.3, 0.7, 0.2, 1)" : undefined,
                  }}
                  key={pirate.rank}
                >
                  {isProposerNow && <span className="proposal-badge">★</span>}

                  {votedYes !== null && (
                    <span className={votedYes ? "vote-bubble is-yes" : "vote-bubble is-no"}>
                      {votedYes ? "✓" : "✗"}
                    </span>
                  )}

                  {showGold && <span className="gold-gain">+{GOLD_SPLIT[pirate.rank]}</span>}

                  <PixelPirate
                    hat={pirate.hat}
                    body={pirate.body}
                    skin={pirate.skin}
                    senior={isSeniorLook}
                    grayedOut={grayedOut && !isEatenNow}
                  />

                  {isEatenNow && (
                    <div className="shark-scene">
                      <span className="blood-flash" />
                      <PixelShark />
                      {BLOOD_DOTS.map((dot, i) => (
                        <span
                          key={i}
                          className="blood-dot"
                          style={
                            {
                              "--bx": `${dot.tx}px`,
                              "--by": `${dot.ty}px`,
                              width: `${dot.size}px`,
                              height: `${dot.size}px`,
                              animationDelay: `${dot.delay}s`,
                            } as CSSProperties
                          }
                        />
                      ))}
                    </div>
                  )}

                  <p className="pirate-label">
                    #{displayRank}
                    <span>{displayTitle}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
