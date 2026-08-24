// Problem generator for the Arithmetic Drill — fast mental-math reps across
// twelve categories: long addition/subtraction/multiplication, fast
// division, decimal add/subtract/multiply, and the full fraction set
// (add, subtract, multiply, divide, reduce). Every problem is generated
// fresh (no fixed bank), graded either by exact match (whole-number ops),
// reduced-fraction equivalence (fraction problems, accepting "a/b" or a
// decimal answer), or numeric tolerance (decimals). Same gcd/reduceFraction
// helper pattern used by the other games' math modules.

export type DrillCategory =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "decimal-add"
  | "decimal-subtract"
  | "decimal-multiply"
  | "add-fraction"
  | "subtract-fraction"
  | "multiply-fraction"
  | "divide-fraction"
  | "reduce-fraction";

export const DRILL_CATEGORIES: DrillCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "decimal-add",
  "decimal-subtract",
  "decimal-multiply",
  "add-fraction",
  "subtract-fraction",
  "multiply-fraction",
  "divide-fraction",
  "reduce-fraction",
];

export const CATEGORY_LABEL: Record<DrillCategory, string> = {
  addition: "Long addition",
  subtraction: "Long subtraction",
  multiplication: "Long multiplication",
  division: "Fast division",
  "decimal-add": "Decimal addition",
  "decimal-subtract": "Decimal subtraction",
  "decimal-multiply": "Decimal multiplication",
  "add-fraction": "Adding fractions",
  "subtract-fraction": "Subtracting fractions",
  "multiply-fraction": "Multiplying fractions",
  "divide-fraction": "Dividing fractions",
  "reduce-fraction": "Reducing fractions",
};

export type DrillProblem = {
  id: string;
  category: DrillCategory;
  prompt: string;
  correctDisplay: string;
  checkAnswer: (raw: string) => boolean;
};

// Deterministic PRNG (mulberry32). A race is only fair if both players see
// the exact same cards in the same order, and a ghost recorded yesterday has
// to replay the identical deck today — so the whole deck is derived from one
// integer seed that gets stored alongside the run.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Module-level so the generators don't each need an rng parameter threaded
// through them. buildDeck swaps it in, builds the whole deck synchronously,
// and always restores it — nothing else can observe the swap.
let rng: () => number = Math.random;
let idCounter = 0;

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function reduceFraction(numerator: number, denominator: number) {
  const sign = denominator < 0 ? -1 : 1;
  const n = numerator * sign;
  const d = denominator * sign;
  const g = gcd(Math.abs(n), d) || 1;
  return { n: n / g, d: d / g };
}

function fractionDisplay(n: number, d: number): string {
  return d === 1 ? `${n}` : `${n}/${d}`;
}

function parseFractionOrNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [a, b] = trimmed.split("/").map((s) => Number(s.trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// Exact-match grading for fraction answers: reduces whatever the player
// typed (fraction or decimal) and requires the SAME reduced fraction, not
// just an equal decimal value — so "4/8" doesn't pass for a "1/2" answer.
function checkReducedFraction(raw: string, n: number, d: number): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.includes("/")) {
    const [pn, pd] = trimmed.split("/").map((s) => Number(s.trim()));
    if (!Number.isFinite(pn) || !Number.isFinite(pd) || pd === 0) return false;
    const reduced = reduceFraction(pn, pd);
    return reduced.n === n && reduced.d === d;
  }
  const v = Number(trimmed);
  return Number.isFinite(v) && d === 1 && v === n;
}

function makeProblem(category: DrillCategory, prompt: string, correctDisplay: string, checkAnswer: (raw: string) => boolean): DrillProblem {
  idCounter += 1;
  return { id: `${category}-${idCounter}`, category, prompt, correctDisplay, checkAnswer };
}

function exactCheck(answer: number): (raw: string) => boolean {
  return (raw) => {
    const n = parseFractionOrNumber(raw);
    return n !== null && n === answer;
  };
}

function toleranceCheck(answer: number, tolerance = 0.006): (raw: string) => boolean {
  return (raw) => {
    const n = parseFractionOrNumber(raw);
    return n !== null && Math.abs(n - answer) < tolerance;
  };
}

// --- Whole numbers, sized for real long-form arithmetic, not single digits ---

function genAddition(): DrillProblem {
  const a = randInt(100, 999);
  const b = randInt(100, 999);
  const answer = a + b;
  return makeProblem("addition", `${a} + ${b}`, `${answer}`, exactCheck(answer));
}

function genSubtraction(): DrillProblem {
  const a = randInt(200, 999);
  const b = randInt(10, a - 1);
  const answer = a - b;
  return makeProblem("subtraction", `${a} - ${b}`, `${answer}`, exactCheck(answer));
}

function genMultiplication(): DrillProblem {
  const a = randInt(11, 99);
  const b = randInt(11, 99);
  const answer = a * b;
  return makeProblem("multiplication", `${a} × ${b}`, `${answer}`, exactCheck(answer));
}

function genDivision(): DrillProblem {
  const b = randInt(2, 25);
  const k = randInt(10, 50);
  const a = b * k;
  return makeProblem("division", `${a} ÷ ${b}`, `${k}`, exactCheck(k));
}

// --- Decimals, split by operation the way the request asked for ---

function genDecimalAdd(): DrillProblem {
  const a = randInt(100, 9999) / 100;
  const b = randInt(100, 9999) / 100;
  const answer = Math.round((a + b) * 100) / 100;
  return makeProblem("decimal-add", `${a.toFixed(2)} + ${b.toFixed(2)}`, `${answer}`, toleranceCheck(answer));
}

function genDecimalSubtract(): DrillProblem {
  const a = randInt(1000, 9999) / 100;
  const b = randInt(100, Math.round(a * 100) - 1) / 100;
  const answer = Math.round((a - b) * 100) / 100;
  return makeProblem("decimal-subtract", `${a.toFixed(2)} - ${b.toFixed(2)}`, `${answer}`, toleranceCheck(answer));
}

function genDecimalMultiply(): DrillProblem {
  const a = randInt(10, 199) / 10; // one decimal place, e.g. 4.7
  const b = randInt(2, 12); // whole-number multiplier, keeps the result exact to 1 decimal
  const answer = Math.round(a * b * 10) / 10;
  return makeProblem("decimal-multiply", `${a.toFixed(1)} × ${b}`, `${answer}`, toleranceCheck(answer, 0.06));
}

// --- Fractions: add, subtract, multiply, divide, reduce ---

const SMALL_DENOMS = [2, 3, 4, 5, 6, 8, 9, 10, 12];

function randomFraction(): { n: number; d: number } {
  const d = SMALL_DENOMS[randInt(0, SMALL_DENOMS.length - 1)];
  const n = randInt(1, d - 1);
  return { n, d };
}

function genAddFraction(): DrillProblem {
  const f1 = randomFraction();
  const f2 = randomFraction();
  const { n, d } = reduceFraction(f1.n * f2.d + f2.n * f1.d, f1.d * f2.d);
  return makeProblem("add-fraction", `${f1.n}/${f1.d} + ${f2.n}/${f2.d}`, fractionDisplay(n, d), toleranceCheck(n / d));
}

function genSubtractFraction(): DrillProblem {
  let f1 = randomFraction();
  let f2 = randomFraction();
  // Keep it a subtraction of two proper fractions with a nonnegative result —
  // swap if the first happens to be smaller, same spirit as long subtraction.
  if (f1.n / f1.d < f2.n / f2.d) [f1, f2] = [f2, f1];
  const { n, d } = reduceFraction(f1.n * f2.d - f2.n * f1.d, f1.d * f2.d);
  return makeProblem("subtract-fraction", `${f1.n}/${f1.d} - ${f2.n}/${f2.d}`, fractionDisplay(n, d), toleranceCheck(n / d));
}

function genMultiplyFraction(): DrillProblem {
  const f1 = randomFraction();
  const f2 = randomFraction();
  const { n, d } = reduceFraction(f1.n * f2.n, f1.d * f2.d);
  return makeProblem("multiply-fraction", `${f1.n}/${f1.d} × ${f2.n}/${f2.d}`, fractionDisplay(n, d), toleranceCheck(n / d));
}

function genDivideFraction(): DrillProblem {
  const f1 = randomFraction();
  const f2 = randomFraction();
  // a/b ÷ c/d = a/b × d/c
  const { n, d } = reduceFraction(f1.n * f2.d, f1.d * f2.n);
  return makeProblem("divide-fraction", `${f1.n}/${f1.d} ÷ ${f2.n}/${f2.d}`, fractionDisplay(n, d), toleranceCheck(n / d));
}

function genReduceFraction(): DrillProblem {
  const base = randomFraction();
  const { n: baseN, d: baseD } = reduceFraction(base.n, base.d); // guarantee the target is genuinely in lowest terms
  const k = randInt(2, 6);
  const promptN = baseN * k;
  const promptD = baseD * k;
  return makeProblem(
    "reduce-fraction",
    `Reduce ${promptN}/${promptD} to lowest terms`,
    fractionDisplay(baseN, baseD),
    (raw) => checkReducedFraction(raw, baseN, baseD)
  );
}

const GENERATORS: Record<DrillCategory, () => DrillProblem> = {
  addition: genAddition,
  subtraction: genSubtraction,
  multiplication: genMultiplication,
  division: genDivision,
  "decimal-add": genDecimalAdd,
  "decimal-subtract": genDecimalSubtract,
  "decimal-multiply": genDecimalMultiply,
  "add-fraction": genAddFraction,
  "subtract-fraction": genSubtractFraction,
  "multiply-fraction": genMultiplyFraction,
  "divide-fraction": genDivideFraction,
  "reduce-fraction": genReduceFraction,
};

export function generateProblem(category?: DrillCategory): DrillProblem {
  const cat = category ?? DRILL_CATEGORIES[randInt(0, DRILL_CATEGORIES.length - 1)];
  return GENERATORS[cat]();
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

// The shared deck for a race. Same seed in => byte-identical card sequence,
// which is what makes "who answered card 7 first" a real comparison.
export function buildDeck(seed: number, size: number): DrillProblem[] {
  const previous = rng;
  const previousId = idCounter;
  rng = mulberry32(seed);
  idCounter = 0;
  try {
    return Array.from({ length: size }, () => generateProblem());
  } finally {
    rng = previous;
    idCounter = previousId;
  }
}
