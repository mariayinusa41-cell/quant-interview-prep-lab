// Core math model for the Pick 3/4/5 games — mirrors real state-lottery
// "Pick n" mechanics (verified against an Ohio Pick 5 prize table): every
// play type pays out at exactly a 50% house edge, no exceptions. The "way"
// count just redistributes that same expected value across more or fewer
// winning combinations for the Box bet — it doesn't change how good or bad
// the bet is. That's the whole point of the "edge insight" question below.

export type PickTemplate = {
  n: 3 | 4 | 5;
  digits: number[]; // the player's chosen digits, length n, each 0-9

  ways: number; // n! / product(repeat-group factorials)
  wayLabel: string; // "120-way", "60-way", etc. - for display

  straightPayout: number; // 10^n / 2
  straightProbFraction: string;
  straightProbDecimal: number; // 1 / 10^n

  boxPayout: number; // straightPayout / ways
  boxProbFraction: string;
  boxProbDecimal: number; // ways / 10^n

  pairPayout: number; // always 50
  pairProbFraction: string;
  pairProbDecimal: number; // always 1/100

  // Only present when n allows it (front/back-3 needs n>=4, front/back-4 needs n=5)
  frontBackK?: number;
  frontBackPayout?: number;
  frontBackProbFraction?: string;
  frontBackProbDecimal?: number;
};

function factorial(x: number): number {
  return x <= 1 ? 1 : x * factorial(x - 1);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function reduceFraction(num: number, den: number): { fraction: string; decimal: number } {
  const g = gcd(num, den) || 1;
  const n = num / g;
  const d = den / g;
  return { fraction: d === 1 ? `${n}` : `${n}/${d}`, decimal: n / d };
}

function waysFor(digits: number[]): number {
  const counts: Record<number, number> = {};
  digits.forEach((d) => {
    counts[d] = (counts[d] ?? 0) + 1;
  });
  const repeatsDenominator = Object.values(counts).reduce((prod, c) => prod * factorial(c), 1);
  return factorial(digits.length) / repeatsDenominator;
}

export function buildPickTemplate(digits: number[]): PickTemplate {
  const n = digits.length as 3 | 4 | 5;
  const ways = waysFor(digits);
  const tenToN = Math.pow(10, n);

  const straightPayout = tenToN / 2;
  const straightProb = reduceFraction(1, tenToN);

  const boxPayout = straightPayout / ways;
  const boxProb = reduceFraction(ways, tenToN);

  const pairPayout = 50;
  const pairProb = reduceFraction(1, 100);

  const template: PickTemplate = {
    n,
    digits,
    ways,
    wayLabel: `${ways}-way`,
    straightPayout,
    straightProbFraction: straightProb.fraction,
    straightProbDecimal: straightProb.decimal,
    boxPayout,
    boxProbFraction: boxProb.fraction,
    boxProbDecimal: boxProb.decimal,
    pairPayout,
    pairProbFraction: pairProb.fraction,
    pairProbDecimal: pairProb.decimal,
  };

  if (n >= 4) {
    const k = n === 5 ? 4 : 3;
    const tenToK = Math.pow(10, k);
    const fbProb = reduceFraction(1, tenToK);
    template.frontBackK = k;
    template.frontBackPayout = tenToK / 2;
    template.frontBackProbFraction = fbProb.fraction;
    template.frontBackProbDecimal = fbProb.decimal;
  }

  return template;
}

export type PickResult = {
  straightHit: boolean;
  boxHit: boolean;
  pairHit: boolean;
  frontHit: boolean;
  backHit: boolean;
};

// Checks a randomly-drawn digit sequence against the player's ticket for
// every play type. A ticket can win multiple ways at once (e.g. a Box win
// can also be a Pair win) — this returns all of them, not just the best one.
export function checkResult(template: PickTemplate, drawn: number[]): PickResult {
  const straightHit = template.digits.every((d, i) => d === drawn[i]);
  const boxHit = !straightHit && [...template.digits].sort().join("") === [...drawn].sort().join("");
  const pairHit = template.digits.slice(0, 2).join("") === drawn.slice(0, 2).join("");
  const frontHit = template.frontBackK
    ? template.digits.slice(0, template.frontBackK).every((d, i) => d === drawn[i])
    : false;
  const backHit = template.frontBackK
    ? template.digits.slice(-template.frontBackK).every((d, i) => d === drawn[drawn.length - template.frontBackK! + i])
    : false;
  return { straightHit, boxHit, pairHit, frontHit, backHit };
}

export function drawDigits(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10));
}
