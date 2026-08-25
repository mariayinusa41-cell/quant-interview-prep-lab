"use client";

import type { RuinQuestionKind } from "./ruinQuestions";

// Real typeset maths via native MathML — no KaTeX dependency, no webfont
// payload, and it renders in every browser this site targets. The formulas
// were previously inline text like "ψ(u) = (1/(1+θ))·e^(−R·u)" and a <code>
// block, which is exactly the "can we use LaTeX instead" complaint: a
// fraction written with a slash and an exponent written with a caret is
// harder to read than the thing it stands for.

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <mfrac>
      <mrow>{num}</mrow>
      <mrow>{den}</mrow>
    </mfrac>
  );
}

const OnePlusTheta = (
  <mrow>
    <mo>(</mo>
    <mn>1</mn>
    <mo>+</mo>
    <mi>θ</mi>
    <mo>)</mo>
  </mrow>
);

/** e raised to −R·u, the term that carries the surplus in every bound here. */
const ExpMinusRu = (
  <msup>
    <mi>e</mi>
    <mrow>
      <mo>−</mo>
      <mi>R</mi>
      <mi>u</mi>
    </mrow>
  </msup>
);

export default function RuinFormula({ kind }: { kind: RuinQuestionKind }) {
  let body: React.ReactNode;

  switch (kind) {
    case "psi-u":
      body = (
        <>
          <mi>ψ</mi><mo>(</mo><mi>u</mi><mo>)</mo><mo>=</mo>
          <Frac num={<mn>1</mn>} den={OnePlusTheta} />
          <mo>·</mo>
          {ExpMinusRu}
        </>
      );
      break;
    case "psi-zero":
      body = (
        <>
          <mi>ψ</mi><mo>(</mo><mn>0</mn><mo>)</mo><mo>=</mo>
          <Frac num={<mn>1</mn>} den={OnePlusTheta} />
        </>
      );
      break;
    case "adjustment-R":
      body = (
        <>
          <mi>R</mi><mo>=</mo>
          <Frac num={<mi>θ</mi>} den={<><mo>(</mo><mn>1</mn><mo>+</mo><mi>θ</mi><mo>)</mo><mi>μ</mi></>} />
        </>
      );
      break;
    case "premium-c":
      body = (
        <>
          <mi>c</mi><mo>=</mo><mo>(</mo><mn>1</mn><mo>+</mo><mi>θ</mi><mo>)</mo>
          <mi>λ</mi><mi>μ</mi>
        </>
      );
      break;
    case "lundberg":
      body = (
        <>
          <mi>ψ</mi><mo>(</mo><mi>u</mi><mo>)</mo><mo>≤</mo>
          {ExpMinusRu}
        </>
      );
      break;
    case "required-surplus":
      body = (
        <>
          <mi>u</mi><mo>=</mo>
          <Frac
            num={
              <>
                <mi>ln</mi><mo>[</mo>
                <Frac num={<mn>1</mn>} den={OnePlusTheta} />
                <mo>/</mo><mi>ψ</mi>
                <mo>]</mo>
              </>
            }
            den={<mi>R</mi>}
          />
        </>
      );
      break;
    case "expected-claims":
      body = (
        <>
          <mi>E</mi><mo>[</mo><mi>S</mi><mo>]</mo><mo>=</mo><mi>λ</mi><mi>μ</mi>
        </>
      );
      break;
    case "net-drift":
    default:
      body = (
        <>
          <mi>c</mi><mo>−</mo><mi>λ</mi><mi>μ</mi><mo>=</mo>
          <mi>θ</mi><mi>λ</mi><mi>μ</mi>
        </>
      );
      break;
  }

  return (
    <math className="ruin-math" display="block" xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>{body}</mrow>
    </math>
  );
}
