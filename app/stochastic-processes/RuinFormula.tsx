"use client";

import TeX from "../math/TeX";
import type { RuinQuestionKind } from "./ruinQuestions";

// Was ~120 lines of hand-written MathML (<mfrac><mrow><mn>1</mn>...), which
// is why the formulas started life as plain text in the first place. Now
// each one is a single readable TeX string through the shared renderer.

const FORMULAS: Record<RuinQuestionKind, string> = {
  "psi-u": String.raw`\psi(u) = \frac{1}{1+\theta} \cdot e^{-Ru}`,
  "psi-zero": String.raw`\psi(0) = \frac{1}{1+\theta}`,
  "adjustment-R": String.raw`R = \frac{\theta}{(1+\theta)\mu}`,
  "premium-c": String.raw`c = (1+\theta)\lambda\mu`,
  lundberg: String.raw`\psi(u) \le e^{-Ru}`,
  "required-surplus": String.raw`u = \frac{\ln\left[\frac{1}{(1+\theta)\psi}\right]}{R}`,
  "expected-claims": String.raw`\mathbb{E}[S] = \lambda\mu`,
  "net-drift": String.raw`c - \lambda\mu = \theta\lambda\mu`,
};

export default function RuinFormula({ kind }: { kind: RuinQuestionKind }) {
  return <TeX block>{FORMULAS[kind]}</TeX>;
}
