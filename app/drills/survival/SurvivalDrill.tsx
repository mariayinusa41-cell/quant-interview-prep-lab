"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../../audio/SoundProvider";
import { useProfile } from "../../profile/ProfileContext";
import { useAccess } from "../../access/AccessContext";
import { AccessStartButton } from "../../access/TokenPlayButton";

const GAME_ID = "drills-survival-run";
import {
  SPRITE_TREX,
  SPRITE_CACTUS_LARGE,
  SPRITE_CACTUS_SMALL,
  SPRITE_CLOUD,
  SPRITE_HORIZON,
  SPRITE_RESTART,
  SPRITE_TEXT,
} from "./trexSprites";

// Sprite-accurate port of the classic Chrome offline dino runner: same
// spritesheet frame layout, same digit/GAME-OVER glyph strip, same
// GRAVITY/jump-velocity feel — but the jump trigger is a solved math
// problem instead of a free keystroke, and the one key that fires it is
// literally the space bar, bound at the document level exactly like the
// original game binds it, not to a focused input.

type Category = "ALL" | "ARITHMETIC" | "FRACTIONS" | "PERCENTAGES";
const CATEGORIES: Category[] = ["ALL", "ARITHMETIC", "FRACTIONS", "PERCENTAGES"];

interface Question {
  prompt: string;
  answer: string;
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pickOne = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Multiply before dividing. (110 / 100) * 180 is 198.00000000000003 in
// binary floating point, and that full string is what the answer key would
// have demanded the player type.
const pctOf = (pct: number, base: number): number => (pct * base) / 100;

// Ten tiers, ten questions each. Tier 1 is deliberately trivial — single
// digit sums, half of a round number — because the failure mode for a drill
// like this isn't being too easy, it's a new player bouncing off question
// three and never coming back. The ramp is gentle enough that each tier feels
// like a small step up from the one before rather than a wall.
const TIER_SIZE = 10;
const TIER_COUNT = 10;

export function difficultyTier(score: number): number {
  return Math.min(TIER_COUNT - 1, Math.floor(score / TIER_SIZE));
}

// Score at which the last tier begins — both the speed and spacing ramps are
// pinned to this so maximum pace lands exactly when the hardest questions do,
// instead of the two curves drifting apart when either is retuned.
const RAMP_SCORE = (TIER_COUNT - 1) * TIER_SIZE;

// One difficulty ladder, not three parallel ones. A tier is a *mix* of
// question kinds chosen to sit at the same level of hard, so "tier 4" means
// the same amount of effort whether it hands you a times table, a quarter of
// something, or a third of something.
//
// Tiers 1-2 are deliberately smooth — single-digit sums, halving a round
// number — because the failure mode for a drill isn't being too easy, it's a
// new player bouncing off question three. From tier 3 the difficulty climbs
// steadily, and tiers 8-10 are meant to be genuinely hard.
//
// Every generated answer is a whole number or a fraction already in lowest
// terms: checking is string equality, so an answer key of "2/8" would mark a
// player wrong for correctly typing "1/4".

type QCat = "ARITHMETIC" | "FRACTIONS" | "PERCENTAGES";
type Gen = { cat: QCat; make: () => Question };

const A = (make: () => Question): Gen => ({ cat: "ARITHMETIC", make });
const F = (make: () => Question): Gen => ({ cat: "FRACTIONS", make });
const P = (make: () => Question): Gen => ({ cat: "PERCENTAGES", make });

// --- arithmetic, modelled on zetamac. Subtraction and division are built
// backwards from their inverse, so answers are whole and never negative. ---
const add = (lo: number, hi: number) => (): Question => {
  const a = rand(lo, hi);
  const b = rand(lo, hi);
  return { prompt: `${a} + ${b}`, answer: `${a + b}` };
};
const sub = (lo: number, hi: number) => (): Question => {
  const result = rand(lo, hi);
  const b = rand(lo, hi);
  return { prompt: `${result + b} - ${b}`, answer: `${result}` };
};
const mul = (aLo: number, aHi: number, bLo: number, bHi: number) => (): Question => {
  const a = rand(aLo, aHi);
  const b = rand(bLo, bHi);
  return { prompt: `${a} × ${b}`, answer: `${a * b}` };
};
const div = (dLo: number, dHi: number, qLo: number, qHi: number) => (): Question => {
  const d = rand(dLo, dHi);
  const q = rand(qLo, qHi);
  return { prompt: `${d * q} ÷ ${d}`, answer: `${q}` };
};

// --- percentages. Every (pct, base) pairing keeps the result whole: a
// decimal answer in a speed drill is a typo waiting to happen. ---
const pct = (pcts: readonly number[], mult: number, maxMult: number) => (): Question => {
  const base = rand(1, maxMult) * mult;
  const p = pickOne(pcts);
  return { prompt: `${p}% of ${base}`, answer: `${pctOf(p, base)}` };
};
const pctChange = (pcts: readonly number[], mult: number, maxMult: number) => (): Question => {
  const base = rand(1, maxMult) * mult;
  const p = pickOne(pcts);
  const delta = pctOf(p, base);
  return Math.random() > 0.5
    ? { prompt: `${base} increased by ${p}%`, answer: `${base + delta}` }
    : { prompt: `${base} decreased by ${p}%`, answer: `${base - delta}` };
};

// --- fractions. "n/d of base" divides evenly because base is a multiple of
// d, and n is drawn coprime with d so a late tier can't quietly reduce to
// "1/2 of 24" and land easier than an earlier one. ---
const unitFrac = (dens: readonly number[], maxMult: number) => (): Question => {
  const d = pickOne(dens);
  const base = d * rand(2, maxMult);
  return { prompt: `1/${d} of ${base}`, answer: `${base / d}` };
};
const partFrac = (dens: readonly number[], loMult: number, hiMult: number) => (): Question => {
  const den = pickOne(dens);
  const base = den * rand(loMult, hiMult);
  const options: number[] = [];
  for (let n = 2; n < den; n++) if (gcd(n, den) === 1) options.push(n);
  const num = options.length > 0 ? pickOne(options) : 1;
  return { prompt: `${num}/${den} of ${base}`, answer: `${(base / den) * num}` };
};
// Numerators forced to an odd sum so the result is already in lowest terms.
const eighths = (): Question => {
  const n1 = pickOne([1, 2, 3] as const);
  const n2 = n1 % 2 === 0 ? pickOne([1, 3] as const) : pickOne([2, 4] as const);
  return { prompt: `${n1}/8 + ${n2}/8`, answer: `${n1 + n2}/8` };
};
const classicPairs = (): Question =>
  pickOne([
    { prompt: "1/2 + 1/4", answer: "3/4" },
    { prompt: "3/4 - 1/2", answer: "1/4" },
    { prompt: "1/3 + 1/3", answer: "2/3" },
    { prompt: "1 - 1/5", answer: "4/5" },
    { prompt: "2/3 + 1/6", answer: "5/6" },
  ]);

// A generator listed more than once in a tier simply comes up more often —
// that's how the early tiers stay weighted toward plain arithmetic while
// still occasionally showing an easy fraction or percentage.
const TIERS: Gen[][] = [
  // 1 — smooth. Single-digit sums, halving, half of an even number.
  [A(add(1, 9)), A(add(1, 9)), A(add(1, 9)), P(pct([50], 10, 10)), F(unitFrac([2], 10))],
  // 2 — still smooth. Subtraction appears; 10% is just moving the decimal.
  [A(add(1, 9)), A(add(2, 20)), A(sub(1, 9)), P(pct([10], 10, 10)), F(unitFrac([2, 4], 8))],
  // 3 — starts asking for something.
  [A(add(2, 20)), A(sub(2, 20)), A(mul(2, 9, 2, 9)), P(pct([10, 50], 10, 12)), F(unitFrac([2, 3, 4], 8))],
  // 4 — full times tables, quarters, thirds.
  [A(add(5, 40)), A(sub(5, 40)), A(mul(2, 12, 2, 12)), P(pct([10, 20, 25], 20, 10)), F(unitFrac([3, 4, 5], 9))],
  // 5 — two-digit work and the first non-unit numerators.
  [A(add(10, 60)), A(sub(10, 60)), A(mul(2, 12, 2, 15)), P(pct([20, 25, 50, 75], 20, 12)), F(partFrac([3, 4], 2, 8))],
  // 6 — zetamac's stock ranges; awkward-but-round percentages.
  [A(add(2, 100)), A(sub(2, 100)), A(mul(2, 12, 2, 25)), P(pct([5, 15, 30, 40], 20, 12)), F(eighths)],
  // 7 — division joins; over 100%; unlike denominators.
  [A(add(2, 100)), A(sub(2, 100)), A(div(2, 12, 2, 25)), P(pct([15, 30, 40, 110], 20, 12)), F(classicPairs)],
  // 8 — zetamac's default multiplication; percentage change.
  [A(add(20, 100)), A(sub(20, 100)), A(mul(2, 12, 13, 100)), A(div(2, 12, 2, 100)), P(pctChange([10, 25, 50], 20, 12)), F(partFrac([3, 4, 5, 6], 2, 9))],
  // 9 — three digits creeping in; harder deltas; sevenths and eighths.
  [A(add(50, 300)), A(sub(50, 300)), A(mul(11, 25, 11, 25)), A(div(3, 15, 3, 40)), P(pctChange([5, 15, 25, 35], 20, 12)), F(partFrac([6, 7, 8], 3, 10))],
  // 10 — long form: three-digit add/sub, two-by-two multiplication.
  [A(add(100, 999)), A(sub(100, 999)), A(mul(11, 40, 11, 40)), A(div(3, 25, 3, 40)), P(pct([12, 18, 24, 36, 44], 50, 8)), F(partFrac([6, 7, 8, 9, 12], 4, 12))],
];

function generateQuestion(category: Category, score: number): Question {
  const pool = TIERS[difficultyTier(score)];
  // The category chips filter the tier's mix rather than selecting a separate
  // ladder, so "FRACTIONS at tier 4" is the same difficulty as everything
  // else at tier 4. Every tier carries at least one generator per category,
  // so the filtered pool is never empty.
  const filtered = category === "ALL" ? pool : pool.filter((g) => g.cat === category);
  return pickOne(filtered.length > 0 ? filtered : pool).make();
}

// ---- sprite sheet geometry, copied from the original Runner/Trex/Obstacle
// config so frames line up with the real asset instead of guessed crops. ----
const TREX_W = 44;
const TREX_H = 47;
const TREX_FRAME = { WAITING: [44, 0], RUNNING: [88, 132], CRASHED: [220], JUMPING: [0] } as const;

const GROUND_Y = 100; // trex foot line inside the 150px-tall canvas
const HORIZON_Y = 127;
const HORIZON_SEG = 600; // width of one horizon tile in the sprite

const DIGIT_W = 10;
const DIGIT_H = 13;
const GAMEOVER_SRC = { x: 0, y: 13, w: 191, h: 11 };

const FPS = 60;

const STARTING_LIVES = 3;

// How far ahead of the dino a banked jump fires, expressed in frames of
// travel so it scales with speed. The hop hangs ~37 frames, so launching
// ~16 frames out puts the dino near its apex as the cactus passes under.
const JUMP_LEAD_FRAMES = 16;
// Width of a "double cactus" cluster: one hop clears the pair, so one
// correct answer should too.
const CLUSTER_SPAN = 60;
// Frames of mercy after a hit: long enough to clear the cactus you just hit
// and read the next prompt, rather than losing all three lives to one
// obstacle in three consecutive frames.
const INVULN_FRAMES = 100;

// The gap between obstacles IS the time to answer, since every obstacle needs
// one solved question. The old game opened at ~1.7s, which is not enough to
// read a prompt, do the arithmetic and type it — this opens two seconds
// slower and tightens as the score climbs, reaching the old pace around
// score 30.
// Both ramps run out at RAMP_SCORE — the score the final question tier starts
// at — so speed and difficulty escalate together instead of the board hitting
// maximum pace while you're still on easy arithmetic.
const START_GAP_SEC = 4.0;
const MIN_GAP_SEC = 1.7;
const GAP_DECAY_PER_POINT = (START_GAP_SEC - MIN_GAP_SEC) / RAMP_SCORE;

const START_SPEED = 3.6;
const MAX_SPEED = 12;
const SPEED_PER_POINT = (MAX_SPEED - START_SPEED) / RAMP_SCORE;

function gapFramesFor(score: number): number {
  const seconds = Math.max(MIN_GAP_SEC, START_GAP_SEC - score * GAP_DECAY_PER_POINT);
  // Jitter shrinks with the gap so late-game spacing stays tight and fair.
  return seconds * FPS + Math.random() * (seconds * 0.15 * FPS);
}

function speedFor(score: number): number {
  return Math.min(MAX_SPEED, START_SPEED + score * SPEED_PER_POINT);
}

function useSprites() {
  const [ready, setReady] = useState(false);
  const imgs = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const sources: Record<string, string> = {
      trex: SPRITE_TREX,
      cactusLarge: SPRITE_CACTUS_LARGE,
      cactusSmall: SPRITE_CACTUS_SMALL,
      cloud: SPRITE_CLOUD,
      horizon: SPRITE_HORIZON,
      restart: SPRITE_RESTART,
      text: SPRITE_TEXT,
    };
    let loaded = 0;
    const total = Object.keys(sources).length;
    Object.entries(sources).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        loaded += 1;
        if (loaded === total) setReady(true);
      };
      img.src = src;
      imgs.current[key] = img;
    });
  }, []);

  return { ready, imgs: imgs.current };
}

export default function SurvivalDrill() {
  const { playSfx } = useSound?.() || { playSfx: () => {} };
  useProfile?.();
  const { ready: spritesReady, imgs } = useSprites();

  const [status, setStatus] = useState<"menu" | "playing" | "gameover">("menu");
  const [category, setCategory] = useState<Category>("ALL");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [question, setQuestion] = useState<Question>({ prompt: "", answer: "" });
  const [input, setInput] = useState("");
  const [isWrongShake, setIsWrongShake] = useState(false);
  // Briefly flashed over the canvas when a life is lost, so a hit reads as an
  // event rather than the score just quietly failing to go up.
  const [hitFlash, setHitFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Kept in refs (not state) so the rAF loop reads live values without
  // re-subscribing every render.
  const statusRef = useRef(status);
  const inputRef2 = useRef(input);
  const questionRef = useRef(question);
  const scoreRef = useRef(score);
  const highScoreRef = useRef(highScore);
  statusRef.current = status;
  inputRef2.current = input;
  questionRef.current = question;
  scoreRef.current = score;
  highScoreRef.current = highScore;

  const engineRef = useRef<{
    running: boolean;
    speed: number;
    tRex: { x: number; y: number; vy: number; jumping: boolean; groundY: number; width: number; height: number };
    obstacles: Array<{ x: number; y: number; width: number; height: number; large: boolean; cleared?: boolean }>;
    horizonX: [number, number];
    horizonBumpy: [boolean, boolean];
    clouds: Array<{ x: number; y: number; speed: number }>;
    spawnTimer: number;
    runTimer: number;
    lastFrameTime: number;
    reqId: number;
    idleTimer: number;
    idleFrame: number;
    lives: number;
    invuln: number;
    jumpCredits: number;
  }>({
    running: false,
    speed: START_SPEED,
    tRex: { x: 50, y: GROUND_Y, vy: 0, jumping: false, groundY: GROUND_Y, width: TREX_W, height: TREX_H },
    obstacles: [],
    horizonX: [0, HORIZON_SEG],
    horizonBumpy: [false, false],
    clouds: [],
    spawnTimer: 0,
    runTimer: 0,
    lastFrameTime: 0,
    reqId: 0,
    idleTimer: 0,
    idleFrame: 0,
    lives: STARTING_LIVES,
    invuln: 0,
    jumpCredits: 0,
  });

  // A correct answer banks a jump instead of firing one immediately.
  //
  // Jumping on the keystroke looked right but played wrong: the hop lasts
  // ~0.6s while a freshly spawned cactus needs up to 2.6s to arrive, so
  // answering *quickly* meant landing long before the obstacle got there and
  // losing a life despite being correct. The engine now spends the credit
  // when the cactus is actually in range, which makes the arithmetic the only
  // thing being tested — which is the point of the drill.
  const bankJump = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.running) return;
    eng.jumpCredits += 1;
    playSfx("correct");
  }, [playSfx]);

  const handleGameOver = useCallback(() => {
    const eng = engineRef.current;
    eng.running = false;
    cancelAnimationFrame(eng.reqId);
    setStatus("gameover");
    playSfx("wrong");
  }, [playSfx]);

  // A crash costs one life rather than the run. The obstacles on screen are
  // cleared along with it — resuming into the same cactus you just hit would
  // burn the remaining lives before the mercy window could help.
  const handleHit = useCallback(() => {
    const eng = engineRef.current;
    eng.lives -= 1;
    setLives(eng.lives);
    playSfx("wrong");

    if (eng.lives <= 0) {
      handleGameOver();
      return false;
    }

    eng.invuln = INVULN_FRAMES;
    eng.obstacles = [];
    eng.jumpCredits = 0;
    eng.spawnTimer = gapFramesFor(scoreRef.current);
    eng.tRex.y = eng.tRex.groundY;
    eng.tRex.jumping = false;
    eng.tRex.vy = 0;
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 320);
    return true;
  }, [handleGameOver, playSfx]);

  const startGame = useCallback(() => {
    const eng = engineRef.current;
    eng.lives = STARTING_LIVES;
    eng.invuln = 0;
    eng.jumpCredits = 0;
    setLives(STARTING_LIVES);
    setScore(0);
    setInput("");
    setQuestion(generateQuestion(category, 0));
    setStatus("playing");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [category]);

  // Keyboard (SPACE) and canvas-click starts are shortcuts for someone who
  // already has access — they bypass the confirm-purchase modal entirely,
  // so if access is denied they just silently do nothing rather than
  // spending tokens without confirmation. The actual buttons below use
  // AccessStartButton directly, which shows the real modal.
  const { startGameEntry } = useAccess();
  const requestStart = useCallback(() => {
    if (startGameEntry(GAME_ID)) startGame();
  }, [startGameEntry, startGame]);

  // Correct answer -> bank a jump + advance. Wrong -> shake, no penalty
  // beyond the obstacle still bearing down. Called from both the global
  // space-bar handler and (as a fallback) the input's own Enter key.
  const submitAnswer = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const q = questionRef.current;
    const isCorrect = inputRef2.current.trim().toLowerCase() === q.answer.trim().toLowerCase();

    if (isCorrect) {
      bankJump();
      const nextScore = scoreRef.current + 1;
      setScore(nextScore);
      setHighScore((h) => Math.max(h, nextScore));
      setInput("");
      setQuestion(generateQuestion(category, nextScore));
    } else {
      setIsWrongShake(true);
      playSfx("wrong");
      setTimeout(() => setIsWrongShake(false), 350);
    }
  }, [category, playSfx, bankJump]);

  // The space bar is bound globally — like the real dino game — instead of
  // depending on the answer input having focus. It submits the current
  // answer during a run, and starts/restarts the game everywhere else.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (statusRef.current === "menu") requestStart();
      else if (statusRef.current === "playing") submitAnswer();
      else if (statusRef.current === "gameover") requestStart();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [requestStart, submitAnswer]);

  // Canvas game engine loop.
  useEffect(() => {
    if (status !== "playing" || !spritesReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const eng = engineRef.current;
    eng.running = true;
    eng.speed = speedFor(scoreRef.current);
    eng.tRex.y = eng.tRex.groundY;
    eng.tRex.jumping = false;
    eng.tRex.vy = 0;
    eng.obstacles = [];
    eng.jumpCredits = 0;
    eng.runTimer = 0;
    eng.clouds = [
      { x: 150, y: 30, speed: 0.8 },
      { x: 400, y: 20, speed: 0.6 },
    ];
    // First cactus gets the full opening gap — the old fixed 90 frames threw
    // one at you before you'd read the first prompt.
    eng.spawnTimer = gapFramesFor(0);

    const gravity = 0.6;

    const drawDigits = (value: number, digits: number, rightX: number, y: number, dim = false) => {
      const str = String(Math.max(0, Math.floor(value))).padStart(digits, "0");
      ctx.save();
      if (dim) ctx.globalAlpha = 0.8;
      for (let i = 0; i < str.length; i++) {
        const d = Number(str[i]);
        const x = rightX - (str.length - i) * DIGIT_W;
        ctx.drawImage(imgs.text, d * DIGIT_W, 0, DIGIT_W, DIGIT_H, x, y, DIGIT_W, DIGIT_H);
      }
      ctx.restore();
    };

    const loop = (timestamp: number) => {
      if (!eng.running) return;

      const dt = eng.lastFrameTime ? Math.min((timestamp - eng.lastFrameTime) / 16.6, 2) : 1;
      eng.lastFrameTime = timestamp;
      eng.runTimer += dt;
      if (eng.invuln > 0) eng.invuln = Math.max(0, eng.invuln - dt);

      // Pace tracks the live score. Reading it from the ref (rather than
      // re-creating this whole effect on every point) is what keeps the field
      // continuous — the old deps list restarted the engine each answer,
      // which wiped the cactus mid-approach and reset the spawn clock.
      const liveScore = scoreRef.current;

      // 1. T-Rex jump arc.
      if (eng.tRex.jumping) {
        eng.tRex.y += eng.tRex.vy * dt;
        eng.tRex.vy += gravity * dt;
        if (eng.tRex.y >= eng.tRex.groundY) {
          eng.tRex.y = eng.tRex.groundY;
          eng.tRex.jumping = false;
          eng.tRex.vy = 0;
        }
      }

      // 2. Horizon — two tiles chase each other so the seam never shows,
      // and each re-picks flat vs. bumpy the moment it wraps, same as
      // HorizonLine.updateXPos.
      const advance = eng.speed * dt;
      const [x0, x1] = eng.horizonX;
      if (x0 <= 0) {
        eng.horizonX[0] -= advance;
        eng.horizonX[1] = eng.horizonX[0] + HORIZON_SEG;
        if (eng.horizonX[0] <= -HORIZON_SEG) {
          eng.horizonX[0] += HORIZON_SEG * 2;
          eng.horizonX[1] = eng.horizonX[0] - HORIZON_SEG;
          eng.horizonBumpy[0] = Math.random() > 0.5;
        }
      } else {
        eng.horizonX[1] -= advance;
        eng.horizonX[0] = eng.horizonX[1] + HORIZON_SEG;
        if (eng.horizonX[1] <= -HORIZON_SEG) {
          eng.horizonX[1] += HORIZON_SEG * 2;
          eng.horizonX[0] = eng.horizonX[1] - HORIZON_SEG;
          eng.horizonBumpy[1] = Math.random() > 0.5;
        }
      }

      // 3. Clouds drift slower than the ground (parallax).
      eng.clouds.forEach((c) => {
        c.x -= c.speed * dt;
        if (c.x < -60) c.x = canvas.width + Math.random() * 100;
      });

      // 4. Obstacles.
      eng.spawnTimer -= dt;
      if (eng.spawnTimer <= 0) {
        const large = Math.random() > 0.5;
        const w = large ? 25 : 17;
        const h = large ? 50 : 35;
        eng.obstacles.push({ x: canvas.width + 20, y: GROUND_Y + (TREX_H - h), width: w, height: h, large });
        // A second cactus close behind, some of the time — the original's
        // "double" clustering, done as two independent hitboxes instead of
        // a guessed sprite crop.
        if (Math.random() > 0.7) {
          eng.obstacles.push({
            x: canvas.width + 20 + w + 6,
            y: GROUND_Y + (TREX_H - h),
            width: w,
            height: h,
            large,
          });
        }
        eng.spawnTimer = gapFramesFor(liveScore);
      }

      // Spend a banked jump on the nearest obstacle once it's close enough
      // that the hop will actually cover it. The lead scales with speed so
      // the launch looks right at tier 1 and tier 10 alike.
      if (eng.jumpCredits > 0) {
        const lead = JUMP_LEAD_FRAMES * eng.speed;
        const next = eng.obstacles.find((o) => !o.cleared && o.x + o.width > eng.tRex.x);
        if (next && next.x - eng.tRex.x <= lead) {
          eng.jumpCredits -= 1;
          // A "double" spawn is two hitboxes a few px apart that one hop
          // clears — mark the whole cluster so it doesn't cost two answers.
          for (const o of eng.obstacles) {
            if (!o.cleared && o.x >= next.x - 1 && o.x <= next.x + CLUSTER_SPAN) o.cleared = true;
          }
          if (!eng.tRex.jumping) {
            eng.tRex.jumping = true;
            eng.tRex.vy = -11;
          }
        }
      }

      for (let i = eng.obstacles.length - 1; i >= 0; i--) {
        const obs = eng.obstacles[i];
        obs.x -= eng.speed * dt;

        const t = eng.tRex;
        const collision =
          !obs.cleared &&
          t.x + 6 < obs.x + obs.width - 3 &&
          t.x + t.width - 6 > obs.x + 3 &&
          t.y + 6 < obs.y + obs.height &&
          t.y + t.height - 2 > obs.y + 3;

        if (collision && eng.invuln <= 0) {
          // handleHit returns false when that was the last life, in which
          // case it has already stopped the engine.
          if (!handleHit()) return;
          break;
        }
        if (obs.x + obs.width < -10) eng.obstacles.splice(i, 1);
      }

      eng.speed = speedFor(liveScore);

      // ---- render ----
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.9;
      eng.clouds.forEach((c) => ctx.drawImage(imgs.cloud, 0, 0, 46, 14, c.x, c.y, 46, 14));
      ctx.globalAlpha = 1;

      [0, 1].forEach((i) => {
        const srcX = eng.horizonBumpy[i as 0 | 1] ? HORIZON_SEG : 0;
        ctx.drawImage(imgs.horizon, srcX, 0, HORIZON_SEG, 12, eng.horizonX[i], HORIZON_Y, HORIZON_SEG, 12);
      });

      eng.obstacles.forEach((obs) => {
        const img = obs.large ? imgs.cactusLarge : imgs.cactusSmall;
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
      });

      const t = eng.tRex;
      let srcX: number;
      if (t.jumping) srcX = TREX_FRAME.JUMPING[0];
      else {
        const legFrame = Math.floor((eng.runTimer * 16.6) / 90) % 2;
        srcX = TREX_FRAME.RUNNING[legFrame];
      }
      // Blink through the mercy window so it's obvious the hit registered and
      // that you're briefly untouchable.
      const blinkOff = eng.invuln > 0 && Math.floor(eng.runTimer / 5) % 2 === 0;
      if (!blinkOff) {
        ctx.drawImage(imgs.trex, srcX, 0, TREX_W, TREX_H, t.x, t.y, TREX_W, TREX_H);
      }

      drawDigits(liveScore, 5, canvas.width - 12, 8);
      if (highScoreRef.current > 0) {
        drawDigits(highScoreRef.current, 5, canvas.width - 12 - 6 * DIGIT_W, 8, true);
      }

      eng.reqId = requestAnimationFrame(loop);
    };

    eng.lastFrameTime = performance.now();
    eng.reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(eng.reqId);
      eng.running = false;
    };
    // Deliberately does NOT depend on score/highScore: those are read from
    // refs inside the loop. Listing them here tore down and rebuilt the whole
    // engine on every correct answer, which cleared the obstacles mid-flight
    // and made the time you actually get to answer unpredictable.
  }, [status, handleGameOver, handleHit, spritesReady, imgs]);

  // Idle render for the menu and game-over screens (static frame, no rAF
  // loop needed) so the sprites are visible before a run starts.
  useEffect(() => {
    if (status === "playing" || !spritesReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.9;
    ctx.drawImage(imgs.cloud, 0, 0, 46, 14, 150, 30, 46, 14);
    ctx.drawImage(imgs.cloud, 0, 0, 46, 14, 420, 20, 46, 14);
    ctx.globalAlpha = 1;

    ctx.drawImage(imgs.horizon, 0, 0, HORIZON_SEG, 12, 0, HORIZON_Y, HORIZON_SEG, 12);

    const srcX = status === "gameover" ? TREX_FRAME.CRASHED[0] : TREX_FRAME.WAITING[0];
    ctx.drawImage(imgs.trex, srcX, 0, TREX_W, TREX_H, 50, GROUND_Y, TREX_W, TREX_H);

    if (highScore > 0) {
      const str = String(highScore).padStart(5, "0");
      for (let i = 0; i < str.length; i++) {
        const d = Number(str[i]);
        const x = canvas.width - 12 - (str.length - i) * DIGIT_W;
        ctx.drawImage(imgs.text, d * DIGIT_W, 0, DIGIT_W, DIGIT_H, x, 8, DIGIT_W, DIGIT_H);
      }
    }

    if (status === "gameover") {
      const cx = canvas.width / 2;
      const goX = Math.round(cx - GAMEOVER_SRC.w / 2);
      const goY = Math.round((canvas.height - 25) / 3);
      ctx.drawImage(
        imgs.text,
        GAMEOVER_SRC.x,
        GAMEOVER_SRC.y,
        GAMEOVER_SRC.w,
        GAMEOVER_SRC.h,
        goX,
        goY,
        GAMEOVER_SRC.w,
        GAMEOVER_SRC.h,
      );
      ctx.drawImage(imgs.restart, 0, 0, 36, 32, cx - 18, canvas.height / 2, 36, 32);
    }
  }, [status, spritesReady, imgs, highScore]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (status !== "gameover") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const centerX = e.currentTarget.width / 2;
    const restartY = e.currentTarget.height / 2;
    if (cx > centerX - 18 && cx < centerX + 18 && cy > restartY && cy < restartY + 32) {
      requestStart();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Space is handled globally; Enter stays as a convenience for anyone
    // used to a normal form submit.
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  };

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <style>{`
        .math-dino-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f7f7f7;
          border-radius: 8px;
          padding: 20px;
          border: 2px solid #ddd;
          max-width: 640px;
          margin: 0 auto;
          font-family: monospace;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .canvas-holder {
          width: 100%;
          background: #f7f7f7;
          border-bottom: 2px solid #666;
          position: relative;
          image-rendering: pixelated;
        }
        .canvas-holder canvas { display: block; width: 100%; image-rendering: pixelated; }
        .math-prompt-box {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .math-equation {
          font-size: 2.2rem;
          font-weight: bold;
          color: #222;
          letter-spacing: 1px;
        }
        .math-input-field {
          font-size: 1.5rem;
          font-family: monospace;
          text-align: center;
          width: 140px;
          padding: 8px 12px;
          border: 3px solid #444;
          border-radius: 4px;
          background: #fff;
          outline: none;
        }
        .math-input-field:focus {
          border-color: #2f8f60;
          box-shadow: 0 0 8px rgba(47, 143, 96, 0.4);
        }
        .shake-animation {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
          border-color: #d9534f !important;
          background: #ffebeb !important;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(3px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .space-hint {
          font-size: 0.85rem;
          color: #777;
        }
        .lives-hit { animation: lives-pop 0.32s ease-out; }
        @keyframes lives-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        kbd {
          display: inline-block;
          padding: 1px 7px;
          border: 1px solid #999;
          border-bottom-width: 3px;
          border-radius: 4px;
          background: #fff;
          color: #333;
          font-size: 0.85em;
          font-family: monospace;
        }
      `}</style>

      <div className="math-dino-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 8 }}>
          <span style={{ fontWeight: "bold", color: "#555" }}>DRILL: DINO DASH</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {status !== "menu" && (
              <span className={hitFlash ? "lives-hit" : ""} aria-label={`${lives} lives remaining`}>
                {Array.from({ length: STARTING_LIVES }, (_, i) => (
                  <span key={i} style={{ color: i < lives ? "#d9534f" : "#d8d8d8", fontSize: "1.05rem" }}>
                    {"♥"}
                  </span>
                ))}
              </span>
            )}
            <span style={{ color: "#888" }}>HI: {String(highScore).padStart(5, "0")}</span>
            <span style={{ fontWeight: "bold", color: "#2f8f60" }}>SCORE: {String(score).padStart(5, "0")}</span>
          </div>
        </div>

        <div className="canvas-holder">
          <canvas ref={canvasRef} width={600} height={150} onClick={handleCanvasClick} />
        </div>

        {status === "menu" && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Dino Dash</h2>
            <p className="space-hint" style={{ marginBottom: 16 }}>
              Type the answer, then hit <kbd>SPACE</kbd> to jump the cactus — space is bound the whole
              page over, just like the real game.
            </p>
            <p className="space-hint" style={{ marginBottom: 16 }}>
              You get <strong>{STARTING_LIVES} lives</strong>. It starts slow and speeds up, and the
              questions climb through ten difficulty tiers as your score builds.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: "6px 12px",
                    background: category === c ? "#2f8f60" : "#eee",
                    color: category === c ? "#fff" : "#333",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <AccessStartButton
              gameId={GAME_ID}
              title="Dino Dash"
              defaultLabel="Start Run"
              onStart={startGame}
              style={{
                padding: "10px 24px",
                fontSize: "1rem",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Start Run <kbd style={{ marginLeft: 6 }}>SPACE</kbd>
            </AccessStartButton>
          </div>
        )}

        {status === "playing" && (
          <div className="math-prompt-box">
            <div className="math-equation">{question.prompt} = ?</div>
            <input
              ref={inputRef}
              type="text"
              className={`math-input-field ${isWrongShake ? "shake-animation" : ""}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="ans"
              autoFocus
              autoComplete="off"
            />
            <span className="space-hint">
              Type the answer anywhere, then press <kbd>SPACE</kbd> to jump
            </span>
          </div>
        )}

        {status === "gameover" && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ color: "#666", marginBottom: 14 }}>
              All three lives gone. The answer was <strong>{question.answer}</strong> — you cleared{" "}
              <strong>{score}</strong> obstacles at difficulty tier{" "}
              <strong>{difficultyTier(score) + 1}</strong>.
            </p>
            <AccessStartButton
              gameId={GAME_ID}
              title="Dino Dash"
              defaultLabel="Try Again"
              onStart={startGame}
              style={{
                padding: "10px 24px",
                fontSize: "1rem",
                background: "#2f8f60",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Try Again <kbd style={{ marginLeft: 6 }}>SPACE</kbd>
            </AccessStartButton>
          </div>
        )}
      </div>
    </div>
  );
}
