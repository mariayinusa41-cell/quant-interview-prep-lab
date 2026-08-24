"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../../audio/SoundProvider";
import { useProfile } from "../../profile/ProfileContext";
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

function generateQuestion(category: Category, score: number): Question {
  const activeCategory =
    category === "ALL"
      ? (["ARITHMETIC", "FRACTIONS", "PERCENTAGES"][Math.floor(Math.random() * 3)] as Category)
      : category;

  const difficulty = Math.floor(score / 4);

  if (activeCategory === "ARITHMETIC") {
    if (difficulty === 0) {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      return { prompt: `${a} + ${b}`, answer: `${a + b}` };
    } else if (difficulty === 1) {
      const a = Math.floor(Math.random() * 11) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      return { prompt: `${a} × ${b}`, answer: `${a * b}` };
    } else {
      const a = Math.floor(Math.random() * 50) + 15;
      const b = Math.floor(Math.random() * 40) + 10;
      return Math.random() > 0.5
        ? { prompt: `${a + b} - ${a}`, answer: `${b}` }
        : { prompt: `${a} + ${b}`, answer: `${a + b}` };
    }
  }

  if (activeCategory === "PERCENTAGES") {
    if (difficulty === 0) {
      const base = (Math.floor(Math.random() * 10) + 1) * 10;
      const pct = Math.random() > 0.5 ? 10 : 50;
      return { prompt: `${pct}% of ${base}`, answer: `${(pct / 100) * base}` };
    } else if (difficulty === 1) {
      const base = (Math.floor(Math.random() * 15) + 1) * 10;
      const pct = [20, 25, 50, 75][Math.floor(Math.random() * 4)];
      return { prompt: `${pct}% of ${base}`, answer: `${(pct / 100) * base}` };
    } else {
      const base = (Math.floor(Math.random() * 8) + 1) * 50;
      const pct = [15, 30, 40, 110][Math.floor(Math.random() * 4)];
      return { prompt: `${pct}% of ${base}`, answer: `${(pct / 100) * base}` };
    }
  }

  if (activeCategory === "FRACTIONS") {
    if (difficulty === 0) {
      const base = (Math.floor(Math.random() * 8) + 1) * 4;
      return { prompt: `1/4 of ${base}`, answer: `${base / 4}` };
    } else if (difficulty === 1) {
      const num1 = Math.floor(Math.random() * 3) + 1;
      const num2 = Math.floor(Math.random() * 3) + 1;
      const den = 8;
      return { prompt: `${num1}/${den} + ${num2}/${den}`, answer: `${num1 + num2}/${den}` };
    } else {
      const pairs = [
        { prompt: "1/2 + 1/4", answer: "3/4" },
        { prompt: "3/4 - 1/2", answer: "1/4" },
        { prompt: "1/3 + 1/3", answer: "2/3" },
        { prompt: "1 - 1/5", answer: "4/5" },
        { prompt: "2/3 + 1/6", answer: "5/6" },
      ];
      return pairs[Math.floor(Math.random() * pairs.length)];
    }
  }

  return { prompt: "2 + 2", answer: "4" };
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
  const [question, setQuestion] = useState<Question>({ prompt: "", answer: "" });
  const [input, setInput] = useState("");
  const [isWrongShake, setIsWrongShake] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Kept in refs (not state) so the rAF loop reads live values without
  // re-subscribing every render.
  const statusRef = useRef(status);
  const inputRef2 = useRef(input);
  const questionRef = useRef(question);
  const scoreRef = useRef(score);
  statusRef.current = status;
  inputRef2.current = input;
  questionRef.current = question;
  scoreRef.current = score;

  const engineRef = useRef<{
    running: boolean;
    speed: number;
    tRex: { x: number; y: number; vy: number; jumping: boolean; groundY: number; width: number; height: number };
    obstacles: Array<{ x: number; y: number; width: number; height: number; large: boolean }>;
    horizonX: [number, number];
    horizonBumpy: [boolean, boolean];
    clouds: Array<{ x: number; y: number; speed: number }>;
    spawnTimer: number;
    runTimer: number;
    lastFrameTime: number;
    reqId: number;
    idleTimer: number;
    idleFrame: number;
  }>({
    running: false,
    speed: 5.5,
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
  });

  const triggerJump = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.tRex.jumping && eng.running) {
      eng.tRex.jumping = true;
      eng.tRex.vy = -11;
      playSfx("correct");
    }
  }, [playSfx]);

  const handleGameOver = useCallback(() => {
    const eng = engineRef.current;
    eng.running = false;
    cancelAnimationFrame(eng.reqId);
    setStatus("gameover");
    playSfx("wrong");
  }, [playSfx]);

  const startGame = useCallback(() => {
    setScore(0);
    setInput("");
    setQuestion(generateQuestion(category, 0));
    setStatus("playing");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [category]);

  // Correct answer -> jump + advance. Wrong -> shake, no penalty beyond the
  // obstacle still bearing down. Called from both the global space-bar
  // handler and (as a fallback) the input's own Enter key.
  const submitAnswer = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const q = questionRef.current;
    const isCorrect = inputRef2.current.trim().toLowerCase() === q.answer.trim().toLowerCase();

    if (isCorrect) {
      triggerJump();
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
  }, [category, playSfx, triggerJump]);

  // The space bar is bound globally — like the real dino game — instead of
  // depending on the answer input having focus. It submits the current
  // answer during a run, and starts/restarts the game everywhere else.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (statusRef.current === "menu") startGame();
      else if (statusRef.current === "playing") submitAnswer();
      else if (statusRef.current === "gameover") startGame();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [startGame, submitAnswer]);

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
    eng.speed = 5.5 + Math.min(score * 0.25, 6.5);
    eng.tRex.y = eng.tRex.groundY;
    eng.tRex.jumping = false;
    eng.tRex.vy = 0;
    eng.obstacles = [];
    eng.runTimer = 0;
    eng.clouds = [
      { x: 150, y: 30, speed: 0.8 },
      { x: 400, y: 20, speed: 0.6 },
    ];
    eng.spawnTimer = 90;

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
        eng.spawnTimer = Math.max(70, 120 - eng.speed * 3.5) + Math.random() * 45;
      }

      for (let i = eng.obstacles.length - 1; i >= 0; i--) {
        const obs = eng.obstacles[i];
        obs.x -= eng.speed * dt;

        const t = eng.tRex;
        const collision =
          t.x + 6 < obs.x + obs.width - 3 &&
          t.x + t.width - 6 > obs.x + 3 &&
          t.y + 6 < obs.y + obs.height &&
          t.y + t.height - 2 > obs.y + 3;

        if (collision) {
          handleGameOver();
          return;
        }
        if (obs.x + obs.width < -10) eng.obstacles.splice(i, 1);
      }

      if (eng.speed < 12) eng.speed += 0.0018 * dt * 16.6;

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
      ctx.drawImage(imgs.trex, srcX, 0, TREX_W, TREX_H, t.x, t.y, TREX_W, TREX_H);

      drawDigits(score, 5, canvas.width - 12, 8);
      if (highScore > 0) drawDigits(highScore, 5, canvas.width - 12 - 6 * DIGIT_W, 8, true);

      eng.reqId = requestAnimationFrame(loop);
    };

    eng.lastFrameTime = performance.now();
    eng.reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(eng.reqId);
      eng.running = false;
    };
  }, [status, score, handleGameOver, spritesReady, imgs, highScore]);

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
      startGame();
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
          <span style={{ fontWeight: "bold", color: "#555" }}>DRILL: SURVIVAL RUN</span>
          <div>
            <span style={{ marginRight: 14, color: "#888" }}>HI: {String(highScore).padStart(5, "0")}</span>
            <span style={{ fontWeight: "bold", color: "#2f8f60" }}>SCORE: {String(score).padStart(5, "0")}</span>
          </div>
        </div>

        <div className="canvas-holder">
          <canvas ref={canvasRef} width={600} height={150} onClick={handleCanvasClick} />
        </div>

        {status === "menu" && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Mental Math Dino Run</h2>
            <p className="space-hint" style={{ marginBottom: 16 }}>
              Type the answer, then hit <kbd>SPACE</kbd> to jump the cactus — space is bound the whole
              page over, just like the real game.
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
            <button
              type="button"
              onClick={startGame}
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
            </button>
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
              The answer was <strong>{question.answer}</strong>. You cleared <strong>{score}</strong> obstacles!
            </p>
            <button
              type="button"
              onClick={startGame}
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
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
