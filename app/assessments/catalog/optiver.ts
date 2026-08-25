import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";
import { mentalMathSet } from "../engine/mentalMath";

/* ------------------------------------------------------------------ */
/* Core Utilities: Collision Resolution & Float Precision             */
/* ------------------------------------------------------------------ */

function generateUniqueChoices(correctAnswer: string, rawDistractors: string[]): string[] {
  const uniqueDistractors = new Set<string>();
  
  for (const d of rawDistractors) {
    if (d !== correctAnswer) uniqueDistractors.add(d);
  }
  
  let fallback = 1;
  while (uniqueDistractors.size < 3) {
    const num = parseFloat(correctAnswer);
    if (!isNaN(num)) {
      const offset = (fallback % 2 === 0 ? fallback : -fallback) * (num > 10 ? 10 : 0.5);
      const newD = formatFloat(num + offset);
      if (newD !== correctAnswer) uniqueDistractors.add(newD);
    } else {
      uniqueDistractors.add(`${correctAnswer}${fallback}`);
    }
    fallback++;
  }
  
  return Array.from(uniqueDistractors).slice(0, 3);
}

function formatFloat(val: number): string {
  return Number.isInteger(val) ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
}

/* ------------------------------------------------------------------ */
/* NumberLogic — sequence rules (Zero-crossing & Sign Agility)        */
/* ------------------------------------------------------------------ */

function sequenceSet(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => {
    const kind = rnd.int(0, 3);
    let seq: number[] = [];
    let next = 0;
    let why = "";

    if (kind === 0) {
      let a = rnd.int(-15, -5);
      const step = rnd.int(3, 8);
      seq = [a];
      for (let k = 0; k < 4; k += 1) { 
        a = a + step + k; 
        seq.push(a); 
      }
      next = seq[4] + step + 4;
      why = `First differences increase by 1 each time, forcing the sequence to cross zero.`;
    } else if (kind === 1) {
      let a = rnd.pick([2, 3, 5]);
      seq = [a];
      for (let k = 0; k < 4; k += 1) { 
        a = a * -2 + (k % 2 === 0 ? 1 : -1); 
        seq.push(a); 
      }
      next = seq[4] * -2 + (4 % 2 === 0 ? 1 : -1);
      why = `Multiply by -2, then alternately add/subtract 1. Checks sign handling agility.`;
    } else if (kind === 2) {
      const a = rnd.int(-5, 5), b = rnd.int(50, 100), da = rnd.int(2, 6), db = -rnd.int(10, 20);
      seq = [a, b, a + da, b + db, a + 2 * da];
      next = b + 2 * db;
      why = "Interleaved sequences: odd positions rise slowly from near zero, evens drop rapidly.";
    } else {
      const m = rnd.pick([-1, 1, 2]);
      let x = rnd.int(-3, 3), y = rnd.int(2, 6);
      seq = [x, y];
      for (let k = 0; k < 3; k += 1) { 
        const z = m * y - x; 
        seq.push(z); 
        x = y; 
        y = z; 
      }
      next = m * seq[4] - seq[3];
      why = `Each term is ${m}× previous minus the one before it.`;
    }

    return {
      id: `nl-${i}`, kind: "numeric" as const,
      prompt: `${seq.join(",  ")},  ?`,
      answer: next, tolerance: 0,
      skill: "pattern-recognition" as const,
      explain: why,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Beat the Odds — EV, odds, and quick probability                     */
/* ------------------------------------------------------------------ */

function beatTheOddsSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const faces = rnd.pick([4, 6, 8, 10, 12, 20]);
      const ev = (faces + 1) / 2;
      const ans = formatFloat(ev);
      const distractors = generateUniqueChoices(ans, [
        formatFloat(faces / 2), 
        formatFloat((faces + 2) / 2), 
        formatFloat(faces)
      ]);
      
      return choiceItem(`bo-${i}`,
        `A fair ${faces}-sided die is rolled once. Expected value?`,
        ans, distractors,
        "expected-value", `(1 + ${faces}) / 2 = ${ans}.`);
    },
    (i: number) => {
      const p = rnd.pick([10, 20, 25, 40, 50]);
      const win = rnd.pick([20, 30, 50, 80, 100]);
      const cost = rnd.pick([5, 10, 15, 20]);
      const ev = (p / 100) * win - cost;
      const ans = formatFloat(ev);
      const distractors = generateUniqueChoices(ans, [
        formatFloat((p / 100) * win), 
        formatFloat(win - cost), 
        formatFloat(ev + cost)
      ]);

      return choiceItem(`bo-${i}`,
        `A ticket costs ${cost}. It pays ${win} with probability ${p}%, else nothing. Expected profit?`,
        ans, distractors,
        "expected-value", `${p}% × ${win} = ${(p / 100) * win}; minus the ${cost} cost gives ${ans}.`);
    },
    (i: number) => {
      const dice = rnd.pick([2, 3, 4]);
      const total = Math.pow(6, dice);
      return choiceItem(`bo-${i}`,
        `Roll ${dice} fair dice. Probability every die shows a six?`,
        `1/${total}`, generateUniqueChoices(`1/${total}`, [`1/${6 * dice}`, `${dice}/6`, `1/${total * 6}`]),
        "conditional-probability", `Independent rolls multiply: (1/6)^${dice} = 1/${total}.`);
    },
    (i: number) => {
      const a = rnd.pick([2, 3, 4, 5]);
      const b = rnd.pick([1, 2, 3]);
      const pct = Math.round((b / (a + b)) * 1000) / 10;
      return choiceItem(`bo-${i}`,
        `A market quotes odds of ${a}-to-${b} against an event. What is the implied probability?`,
        `${pct}%`,
        generateUniqueChoices(`${pct}%`, [`${Math.round((a / (a + b)) * 1000) / 10}%`, `${Math.round((b / a) * 1000) / 10}%`, `${Math.round((a / b) * 1000) / 10}%`]),
        "conditional-probability",
        `Odds of ${a}-to-${b} against means ${b} favourable out of ${a + b} total: ${b}/${a + b} = ${pct}%.`);
    },
    (i: number) => {
      const n2 = rnd.pick([2, 3]);
      const p = 1 - Math.pow(5 / 6, n2);
      const pct = Math.round(p * 1000) / 10;
      return choiceItem(`bo-${i}`,
        `You roll a fair die ${n2} times. Probability of at least one six?`,
        `${pct}%`,
        generateUniqueChoices(`${pct}%`, [`${Math.round((n2 / 6) * 1000) / 10}%`, `${Math.round(Math.pow(1 / 6, n2) * 1000) / 10}%`, `${Math.round((1 - n2 / 6) * 1000) / 10}%`]),
        "conditional-probability",
        `Complement: 1 − (5/6)^${n2} = ${pct}%. Adding 1/6 each time double-counts.`);
    },
    (i: number) => {
      const stake = rnd.pick([10, 20, 50]);
      const p = rnd.pick([55, 60, 65]);
      const ev = Math.round(((p / 100) * stake - ((100 - p) / 100) * stake) * 100) / 100;
      return choiceItem(`bo-${i}`,
        `You win ${stake} with probability ${p}% and lose ${stake} otherwise. Expected value per bet?`,
        String(ev),
        generateUniqueChoices(String(ev), [String(stake), "0", String(Math.round((p / 100) * stake * 100) / 100)]),
        "expected-value",
        `${p}% × ${stake} − ${100 - p}% × ${stake} = ${ev}. The edge is the probability gap times the stake.`);
    }
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

/* ------------------------------------------------------------------ */
/* Zap-N — numerical working memory under load                         */
/* ------------------------------------------------------------------ */

function zapNSet(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => {
    const kind = rnd.int(0, 1);
    if (kind === 0) {
      const count = rnd.int(5, 7);
      const nums = Array.from({ length: count }, () => rnd.int(3, 29));
      const total = nums.reduce((a, b) => a + b, 0);
      return {
        id: `zn-${i}`, kind: "numeric" as const,
        block: nums.join("    "),
        prompt: "Sum of the values above.",
        answer: total, tolerance: 0,
        skill: "mental-math" as const,
        explain: `${nums.join(" + ")} = ${total}.`,
      };
    }
    const nums = Array.from({ length: 6 }, () => rnd.int(11, 99));
    const target = Math.max(...nums);
    const mult = rnd.pick([2, 3, 4]);
    return {
      id: `zn-${i}`, kind: "numeric" as const,
      block: nums.join("    "),
      prompt: `Take the largest value above and multiply it by ${mult}.`,
      answer: target * mult, tolerance: 0,
      skill: "mental-math" as const,
      explain: `Largest is ${target}; ${target} × ${mult} = ${target * mult}.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Zap-Q — abstract pattern and spatial reasoning (Logical Traps)      */
/* ------------------------------------------------------------------ */

const SHAPES = ["■", "●", "▲", "◆", "★", "✚"];

function zapQSet(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => {
    const kind = rnd.int(0, 2);
    
    if (kind === 0) {
      const order = rnd.shuffle(SHAPES).slice(0, 3);
      const row = [order[0], order[1], order[2], order[0], order[1]];
      const correctAnswer = order[2];
      
      const distractors = generateUniqueChoices(correctAnswer, [
        order[1], 
        order[0], 
        SHAPES.find((s) => !order.includes(s)) || SHAPES[3] 
      ]);

      return choiceItem(`zq-${i}`,
        "Which symbol continues the pattern?",
        correctAnswer, distractors,
        "pattern-recognition",
        `The cycle repeats every three: ${order.join(" ")} - so the next is ${correctAnswer}.`,
        row.join("   ") + "   ?");
    }

    if (kind === 1) {
      const grid: string[] = [];
      const targetShape = rnd.pick(SHAPES);
      let count = 0;
      for (let r = 0; r < 3; r += 1) {
        const cells: string[] = [];
        for (let c = 0; c < 4; c += 1) {
          const s = Math.random() < 0.35 ? targetShape : rnd.pick(SHAPES.filter((x) => x !== targetShape));
          if (s === targetShape) count += 1;
          cells.push(s);
        }
        grid.push(cells.join("  "));
      }
      return {
        id: `zq-${i}`, kind: "numeric" as const,
        block: grid.join("\n"),
        prompt: `How many ${targetShape} appear in the grid?`,
        answer: count, tolerance: 0,
        skill: "pattern-recognition" as const,
        explain: `There are ${count}.`,
      };
    }

    const base = rnd.pick(SHAPES);
    const other = rnd.pick(SHAPES.filter((s) => s !== base));
    const pos = rnd.int(0, 3);
    const row = Array.from({ length: 4 }, (_, k) => (k === pos ? other : base));
    return choiceItem(`zq-${i}`,
      "Which position holds the symbol that breaks the pattern?",
      String(pos + 1),
      generateUniqueChoices(String(pos + 1), ["1", "2", "3", "4"].filter((x) => x !== String(pos + 1)).slice(0, 3)),
      "pattern-recognition",
      `Position ${pos + 1} holds ${other}; every other position holds ${base}.`,
      row.map((s, k) => `${k + 1}:${s}`).join("    "));
  });
}

/* ------------------------------------------------------------------ */

export const OPTIVER_TRADING: Assessment = {
  id: "asmt-optiver-trading",
  firm: "Optiver-style",
  title: "Optiver-Style Trading Assessment",
  track: "quant-trading",
  blurb:
    "A full-length sitting modelled on Optiver's published screening battery - 80 in 8, NumberLogic, Beat the Odds, Zap-N and Zap-Q. Roughly an hour, negative marking on the timed sections, and numbers chosen so a shortcut beats long multiplication.",
  rules: [
    "Five sections, about 60 minutes in total. The clock does not stop between them.",
    "80 in 8 is the headline: 80 arithmetic items in 8 minutes, roughly six seconds each.",
    "Timed sections mark negatively - +1 correct, −1 wrong, 0 for a skip. Blind guessing is negative EV.",
    "No going back within a section. Answer or skip, and the next item loads.",
    "A competitive score on the real 80-in-8 is around 65 of 80.",
  ],
  sections: [
    {
      id: "80in8",
      name: "80 in 8",
      brief: "80 arithmetic items in 8 minutes. Integers, fractions, decimals and percentages, mixed.",
      seconds: 8 * 60, penalty: 1, allowBack: false,
      itemCount: 80,
      generate: () => mentalMathSet(80),
    },
    {
      id: "numberlogic",
      name: "NumberLogic",
      brief: "20 sequences in 10 minutes. Identify the rule and give the next term.",
      seconds: 10 * 60, penalty: 1, allowBack: false,
      itemCount: 20,
      generate: () => sequenceSet(20),
    },
    {
      id: "beattheodds",
      name: "Beat the Odds",
      brief: "20 probability and expected-value items in 14 minutes. Odds conversion, EV, complements.",
      seconds: 14 * 60, penalty: 1, allowBack: false,
      itemCount: 20,
      generate: () => beatTheOddsSet(20),
    },
    {
      id: "zapn",
      name: "Zap-N",
      brief: "16 numerical working-memory items in 12 minutes. Hold the values, then act on them.",
      seconds: 12 * 60, penalty: 0, allowBack: false,
      itemCount: 16,
      generate: () => zapNSet(16),
    },
    {
      id: "zapq",
      name: "Zap-Q",
      brief: "18 abstract pattern and spatial items in 14 minutes.",
      seconds: 14 * 60, penalty: 0, allowBack: false,
      itemCount: 18,
      generate: () => zapQSet(18),
    },
  ],
};
