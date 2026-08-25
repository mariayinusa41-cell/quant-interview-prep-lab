"use client";

import { useState } from "react";
import {
  LEVEL_LABELS,
  challengesForLevel,
  type CodingChallenge,
  type MCQuestion,
  type MiniLevel,
} from "./codingChallenges";
import { runTests, type RunResult } from "./runCode";
import { AccessStartButton } from "../access/TokenPlayButton";

const LEVELS: MiniLevel[] = ["rookie", "novice", "intermediate", "advanced"];

type Stage = "pre" | "coding" | "post" | "done";

function MCBlock({
  question,
  onAnswered,
}: {
  question: MCQuestion;
  onAnswered: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    onAnswered(i === question.answer);
  }

  return (
    <div className={answered ? (selected === question.answer ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
      <p className="quiz-q-prompt">{question.prompt}</p>
      <div className="lab-choice-grid">
        {question.choices.map((choice, i) => (
          <button
            type="button"
            key={choice}
            disabled={answered}
            className={
              answered && i === question.answer
                ? "lab-choice is-answer"
                : answered && i === selected
                  ? "lab-choice is-selected"
                  : "lab-choice"
            }
            onClick={() => choose(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>{choice}
          </button>
        ))}
      </div>
      {answered && (
        <p className={selected === question.answer ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
          {selected === question.answer ? "Correct. " : "Not quite. "}
          {question.explanation}
        </p>
      )}
    </div>
  );
}

export default function MiniTask() {
  const [level, setLevel] = useState<MiniLevel | null>(null);
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [stage, setStage] = useState<Stage>("pre");
  const [mcIndex, setMcIndex] = useState(0);
  const [mcCorrectCount, setMcCorrectCount] = useState(0);

  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const [problemsCleared, setProblemsCleared] = useState(0);
  const [totalMcCorrect, setTotalMcCorrect] = useState(0);
  const [totalMcCount, setTotalMcCount] = useState(0);

  function startChallenge(c: CodingChallenge) {
    setChallenge(c);
    setCode(c.starterCode);
    setStage("pre");
    setMcIndex(0);
    setMcCorrectCount(0);
    setRunResult(null);
    setShowSolution(false);
    setRunning(false);
  }

  function chooseLevel(l: MiniLevel) {
    setLevel(l);
    setChallenge(null);
    setStage("pre");
  }

  function chooseChallenge(c: CodingChallenge) {
    startChallenge(c);
  }

  function changeLevel() {
    setLevel(null);
    setChallenge(null);
    setProblemsCleared(0);
    setTotalMcCorrect(0);
    setTotalMcCount(0);
  }

  function handlePreAnswered(correct: boolean) {
    setTotalMcCount((t) => t + 1);
    if (correct) {
      setMcCorrectCount((c) => c + 1);
      setTotalMcCorrect((t) => t + 1);
    }
  }

  function handlePostAnswered(correct: boolean) {
    setTotalMcCount((t) => t + 1);
    if (correct) {
      setMcCorrectCount((c) => c + 1);
      setTotalMcCorrect((t) => t + 1);
    }
  }

  function advancePre() {
    if (!challenge) return;
    if (mcIndex + 1 >= challenge.preQuestions.length) {
      setStage("coding");
      setMcIndex(0);
    } else {
      setMcIndex((i) => i + 1);
    }
  }

  function advancePost() {
    if (!challenge) return;
    if (mcIndex + 1 >= challenge.postQuestions.length) {
      setStage("done");
      setProblemsCleared((p) => p + 1);
    } else {
      setMcIndex((i) => i + 1);
    }
  }

  async function runCode() {
    if (!challenge || running) return;
    setRunning(true);
    setRunResult(null);
    const result = await runTests(code, challenge.functionName, challenge.testCases);
    setRunResult(result);
    setRunning(false);
  }

  function proceedToPost() {
    setStage("post");
    setMcIndex(0);
  }

  function nextChallenge() {
    setChallenge(null);
    setStage("pre");
  }

  const allTestsPassed = !!runResult && !runResult.crashed && runResult.results.length > 0 && runResult.results.every((r) => r.passed);

  // ---------- Level select ----------
  if (!level) {
    return (
      <div className="calc-subgame">
        <p className="calc-subgame-intro">
          What's your coding level? You'll get a couple of warm-up questions, then a real problem to solve by
          typing actual code - it runs for real, in a sandboxed worker in your browser - followed by a couple of
          questions about what you just built.
        </p>
        <div className="algo-level-grid">
          {LEVELS.map((l) => (
            <button type="button" key={l} className="algo-level-btn" onClick={() => chooseLevel(l)}>
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!challenge) {
    const availableChallenges = challengesForLevel(level);
    return (
      <div className="calc-subgame">
        <div className="lab-hud">
          <span>LEVEL <strong>{LEVEL_LABELS[level]}</strong></span>
          <span>CHALLENGES <strong>{availableChallenges.length}</strong></span>
          <span>CLEARED <strong>{problemsCleared}</strong></span>
        </div>
        <p className="calc-subgame-intro">
          Choose a challenge. Each one follows the same path: two warm-up questions, short code, real tests, then two wrap-up questions.
        </p>
        <div className="algo-challenge-list">
            {availableChallenges.map((item, index) => (
            <AccessStartButton
              gameId={index === 0 ? `algorithms-mini-${level}-01` : `algorithms-mini-${level}`}
              title={`${LEVEL_LABELS[level]} Mini Task`}
              className="algo-challenge-row"
              key={item.title}
              onStart={() => chooseChallenge(item)}
            >
              <span className="algo-challenge-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="algo-challenge-copy">
                <strong>{item.title}</strong>
                <span>{item.prompt}</span>
              </span>
            </AccessStartButton>
          ))}
        </div>
        <button type="button" className="chip-btn" onClick={changeLevel}>Change level</button>
      </div>
    );
  }

  // ---------- Problem cleared ----------
  if (stage === "done") {
    return (
      <div className="calc-subgame">
        <div className="lab-hud">
          <span>LEVEL <strong>{LEVEL_LABELS[level]}</strong></span>
          <span>PROBLEMS CLEARED <strong>{problemsCleared}</strong></span>
          <span>MC TOTAL <strong>{totalMcCorrect}/{totalMcCount}</strong></span>
        </div>
        <div className="calc-reveal">
          <p className="quiz-q-explain is-correct">
            {challenge.title} complete - {mcCorrectCount}/{challenge.preQuestions.length + challenge.postQuestions.length}{" "}
            multiple-choice correct, and your code passed every test case.
          </p>
          <div className="algo-mini-actions">
            <button type="button" className="continue-btn" onClick={nextChallenge}>Next problem →</button>
            <button type="button" className="chip-btn" onClick={changeLevel}>Change level</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calc-subgame">
      <div className="lab-hud">
        <span>LEVEL <strong>{LEVEL_LABELS[level]}</strong></span>
        <span>PROBLEM <strong>{challenge.title}</strong></span>
        <span>
          STAGE <strong>{stage === "pre" ? "Warm-up" : stage === "coding" ? "Code" : "Wrap-up"}</strong>
        </span>
      </div>

      {stage === "pre" && (
        <>
          <p className="calc-subgame-intro">
            Warm-up {mcIndex + 1}/{challenge.preQuestions.length} - about the idea behind {challenge.title}, before
            you write any code.
          </p>
          <MCBlock
            key={`pre-${mcIndex}`}
            question={challenge.preQuestions[mcIndex]}
            onAnswered={handlePreAnswered}
          />
          <button type="button" className="continue-btn algo-mc-next" onClick={advancePre}>
            {mcIndex + 1 >= challenge.preQuestions.length ? "Start coding →" : "Next question"}
          </button>
        </>
      )}

      {stage === "coding" && (
        <>
          <div className="algo-dp-header">
            <p className="algo-dp-title">{challenge.title}</p>
            <p className="algo-dp-prompt">{challenge.prompt}</p>
          </div>

          <textarea
            className="algo-code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            rows={10}
          />

          <div className="algo-mini-actions">
            <button type="button" className="calc-submit-btn" onClick={runCode} disabled={running}>
              {running ? "Running…" : "Run tests"}
            </button>
            <button type="button" className="chip-btn" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? "Hide solution" : "Reveal solution"}
            </button>
          </div>

          {showSolution && <pre className="lab-code algo-mini-code">{challenge.referenceSolution}</pre>}

          {runResult && (
            <div className="algo-test-results">
              {runResult.crashed ? (
                <p className="quiz-q-explain is-wrong">
                  {runResult.timedOut ? "Timed out. " : "Crashed. "}
                  {runResult.crashMessage}
                </p>
              ) : (
                <>
                  {runResult.results.map((r, i) => (
                    <div key={i} className={r.passed ? "algo-test-row is-pass" : "algo-test-row is-fail"}>
                      <span>{r.passed ? "✓" : "✗"}</span>
                      <span className="algo-test-label">{r.label}</span>
                      {!r.passed && (
                        <span className="algo-test-detail">
                          {r.error ? `error: ${r.error}` : `got ${JSON.stringify(r.actual)}`}
                        </span>
                      )}
                    </div>
                  ))}
                  {allTestsPassed && (
                    <p className="quiz-q-explain is-correct">
                      All {runResult.results.length} test cases passed.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="algo-mini-actions">
            <button type="button" className="continue-btn" onClick={proceedToPost} disabled={!allTestsPassed}>
              Continue to wrap-up →
            </button>
            {!allTestsPassed && runResult && (
              <span className="algo-mini-hint">All test cases must pass before moving on.</span>
            )}
          </div>
        </>
      )}

      {stage === "post" && (
        <>
          <p className="calc-subgame-intro">
            Wrap-up {mcIndex + 1}/{challenge.postQuestions.length} - now that {challenge.title} is solved, a couple
            of questions about the solution itself.
          </p>
          <MCBlock
            key={`post-${mcIndex}`}
            question={challenge.postQuestions[mcIndex]}
            onAnswered={handlePostAnswered}
          />
          <button type="button" className="continue-btn algo-mc-next" onClick={advancePost}>
            {mcIndex + 1 >= challenge.postQuestions.length ? "Finish problem" : "Next question"}
          </button>
        </>
      )}
    </div>
  );
}
