"use client";

import { useProgress } from "../progress/ProgressContext";
import { SKILL_LABELS, type SkillTag } from "../progress/skills";
import { MAX_SKILL_LEVEL, allSkillLevels, weakestSkills } from "../progress/progression";
import { useSound } from "../audio/SoundProvider";
import { SKILL_HREF } from "../progress/skillLinks";

// Every graded question fills a bar, and every weak skill is a link to the
// lab that trains it — so the panel answers "what am I bad at" and "where do
// I fix it" in the same glance.
//
// Domains mirror the comment blocks in skills.ts rather than introducing a
// second grouping that could drift out of step with it.
const DOMAINS: { name: string; skills: SkillTag[] }[] = [
  { name: "Probability", skills: ["conditional-probability", "combinatorics", "expected-value", "distributions"] },
  { name: "Statistics", skills: ["regression", "selection-bias", "hypothesis-testing"] },
  { name: "Calculus / LA", skills: ["approximation", "optimization", "linear-algebra"] },
  { name: "Stochastic", skills: ["markov-chains", "optional-stopping"] },
  { name: "Algorithms", skills: ["complexity", "dynamic-programming", "data-structures", "monte-carlo", "coding-implementation"] },
  { name: "Finance", skills: ["options-greeks", "market-making"] },
  { name: "Reasoning", skills: ["game-theory", "logic-puzzles", "estimation", "mental-math", "pattern-recognition"] },
];


function Meter({ level }: { level: number }) {
  const tone = level >= 4 ? "is-strong" : level >= 2 ? "is-mid" : "is-weak";
  return (
    <span className="skill-meter" aria-label={`${level} of ${MAX_SKILL_LEVEL}`}>
      {Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => (
        <span key={i} className={i < level ? `skill-seg is-on ${tone}` : "skill-seg"} />
      ))}
    </span>
  );
}

export default function SkillMap() {
  const { skills } = useProgress();
  const { playSfx } = useSound();

  const levels = allSkillLevels(skills);
  const byTag = new Map(levels.map((l) => [l.skill, l]));
  const totalBars = levels.reduce((sum, l) => sum + l.level, 0);
  const maxBars = levels.length * MAX_SKILL_LEVEL;
  const weakest = weakestSkills(skills, 3);

  return (
    <section className="section">
      <div className="skill-map-head">
        <h2>Skill map</h2>
        <span className="skill-map-count">
          {totalBars}/{maxBars} bars filled
        </span>
      </div>
      <p className="section-intro">
        Every graded question fills a bar. Tap a skill to jump to the game that trains it.
      </p>

      <div className="skill-domain-grid">
        {DOMAINS.map((domain) => {
          const domainLevels = domain.skills.map((s) => byTag.get(s)?.level ?? 0);
          const filled = domainLevels.reduce((a, b) => a + b, 0);
          const max = domain.skills.length * MAX_SKILL_LEVEL;
          return (
            <div className="skill-domain" key={domain.name}>
              <div className="skill-domain-head">
                <span className="skill-domain-name">{domain.name}</span>
                <span className="skill-domain-total">{filled}/{max}</span>
              </div>
              <div className="skill-rows">
                {domain.skills.map((skill) => {
                  const level = byTag.get(skill)?.level ?? 0;
                  return (
                    <a
                      className={level <= 1 ? "skill-row is-weak" : "skill-row"}
                      key={skill}
                      href={SKILL_HREF[skill]}
                      onMouseEnter={() => playSfx("select")}
                    >
                      <span className="skill-row-label">{SKILL_LABELS[skill]}</span>
                      <Meter level={level} />
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="skill-weakest">
        {/* Deliberately not "worth 3x XP this week" - the design copy
            promised a multiplier that does not exist, and the handoff's own
            rule is never to advertise a mechanic that isn't real. */}
        <p className="skill-weakest-label">Weakest three - start here</p>
        <div className="skill-weakest-grid">
          {weakest.map((w) => (
            <a
              className="skill-weakest-card"
              key={w.skill}
              href={SKILL_HREF[w.skill]}
              onMouseEnter={() => playSfx("select")}
            >
              <span className="skill-weakest-name">{SKILL_LABELS[w.skill]}</span>
              <span className="skill-weakest-note">
                {w.level}/{MAX_SKILL_LEVEL} · {w.correct === 0 ? "never practised" : `${w.correct} correct so far`}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
