"use client";

import { useEffect, useRef, useState } from "react";
import { SPEED_QUESTIONS, type SpeedQuestion } from "./speedRoundQuestions";
import { AccessStartButton } from "../access/TokenPlayButton";
import { useProgress } from "../progress/ProgressContext";
import { useSound } from "../audio/SoundProvider";
import type { SkillTag } from "../progress/skills";

// Speed Round questions carry a display topic; map it onto the shared skill
// vocabulary so these attempts aggregate with the same skills trained in
// other labs rather than forming a Speed-Round-only silo.
const TOPIC_SKILL: Record<string, SkillTag> = {
  Complexity: "complexity",
  "Dynamic programming": "dynamic-programming",
  "Monte Carlo": "monte-carlo",
  "Python / pandas": "coding-implementation",
};

function skillForTopic(topic: string): SkillTag {
  return TOPIC_SKILL[topic] ?? "complexity";
}

const ROUND_SIZE = 10;
const TIME_LIMIT_S = 20;

type ShuffledQuestion = { topic: string; prompt: string; code?: string; choices: string[]; answer: number; explanation: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffles both question order and each question's choice order, keeping
// the `answer` index correctly pointed at wherever the right choice landed.
function buildShuffledDeck(): ShuffledQuestion[] {
  const picked = shuffle(SPEED_QUESTIONS).slice(0, ROUND_SIZE);
  return picked.map((q: SpeedQuestion) => {
    const order = shuffle(q.choices.map((_, i) => i));
    const choices = order.map((i) => q.choices[i]);
    const answer = order.indexOf(q.answer);
    return { ...q, choices, answer };
  });
}

export default function SpeedRound() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();
  const [phase, setPhase] = useState<"intro" | "playing" | "results">("intro");
  const [deck, setDeck] = useState<ShuffledQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timer, setTimer] = useState(TIME_LIMIT_S);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const current = deck[index];
  const answered = selected !== null;

  const start = () => {
    startMusic("game");
    setDeck(buildShuffledDeck());
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswers([]);
    setPhase("playing");
  };

  const choose = (choice: number) => {
    if (answered || !current) return;
    const correct = choice === current.answer;
    setSelected(choice);
    recordAttempt(skillForTopic(current.topic), correct ? "correct" : "incorrect");
    playSfx(correct ? "correct" : "wrong");
    setAnswers((items) => [...items, correct]);
    if (correct) setScore((value) => value + 100);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const next = () => {
    if (index === deck.length - 1) setPhase("results");
    else {
      setIndex((value) => value + 1);
      setSelected(null);
    }
  };

  useEffect(() => {
    if (phase !== "playing" || answered) return;
    setTimer(TIME_LIMIT_S);
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    timerRef.current = id;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, answered]);

  useEffect(() => {
    if (timer <= 0 && phase === "playing" && !answered) {
      // timed out — count as answered-wrong without a selection
      if (current) recordAttempt(skillForTopic(current.topic), "revealed");
      setAnswers((items) => [...items, false]);
      setSelected(-1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  if (phase === "intro") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">20 seconds a question. Pick the right tool under pressure.</p>
          <p>Ten questions drawn from a pool of {SPEED_QUESTIONS.length}, reshuffled every run — complexity, dynamic programming, Monte Carlo, and pandas.</p>
          <div className="lab-topic-grid">
            {[
              ["COMPLEXITY", "count the work"],
              ["DP", "reuse the states"],
              ["MONTE CARLO", "price the error"],
              ["PANDAS", "move the data"],
            ].map(([title, sub]) => <div key={title}><strong>{title}</strong><span>{sub}</span></div>)}
          </div>
          <button type="button" className="continue-btn" onClick={start}>Start the round</button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="lab-hud"><span>SCORE <strong>{score} / {deck.length * 100}</strong></span><span>{answers.filter(Boolean).length}/{deck.length} correct</span></div>
        <div className="lab-review-list">
          {deck.map((question, questionIndex) => (
            <div className={answers[questionIndex] ? "lab-review is-correct" : "lab-review is-wrong"} key={questionIndex}>
              <span>{answers[questionIndex] ? "CORRECT" : "REVIEW"} · {question.topic}</span>
              <p>{question.prompt}</p>
              <small>{question.explanation}</small>
            </div>
          ))}
        </div>
        <AccessStartButton gameId="algorithms-speed-round" title="Speed Round" defaultLabel="Run it again" className="continue-btn" onStart={start}>
          Run it again
        </AccessStartButton>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>ROUND <strong>{index + 1}/{deck.length}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span className={timer <= 5 ? "algo-speed-timer is-danger" : "algo-speed-timer"}>{answered ? "—" : `${timer}s`}</span>
      </div>
      <div className={answered ? (selected === current.answer ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
        <p className="quiz-q-topic">{current.topic}</p>
        <p className="quiz-q-prompt">{current.prompt}</p>
        {current.code && <pre className="lab-code">{current.code}</pre>}
        <div className="lab-choice-grid">
          {current.choices.map((choice, choiceIndex) => (
            <button
              type="button"
              className={answered && choiceIndex === current.answer ? "lab-choice is-answer" : answered && choiceIndex === selected ? "lab-choice is-selected" : "lab-choice"}
              disabled={answered}
              key={choice}
              onClick={() => choose(choiceIndex)}
            >
              <span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}
            </button>
          ))}
        </div>
        {answered && (
          <p className={selected === current.answer ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            {selected === -1 ? "Time's up. " : selected === current.answer ? "Correct. " : "Not quite. "}
            {current.explanation}
          </p>
        )}
        {answered && <button type="button" className="continue-btn" onClick={next}>{index === deck.length - 1 ? "See score" : "Next round"}</button>}
      </div>
    </div>
  );
}
