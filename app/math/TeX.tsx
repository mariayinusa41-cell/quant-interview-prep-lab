"use client";

import { Fragment, type ReactNode } from "react";

/**
 * A small TeX-subset renderer that emits native MathML.
 *
 * Why not KaTeX: it is ~270KB with webfonts, and every formula on this site
 * is a fraction, a superscript, a Greek letter or a radical — a fraction of
 * what a full TeX engine handles. MathML renders all of that natively in
 * every browser this site targets, with no dependency and no font payload.
 *
 * Why not hand-written MathML: <mfrac><mrow><mn>1</mn></mrow>... is
 * unreadable in source and painful to edit, which is exactly why formulas
 * were written as plain text like "(1/(1+θ))·e^(−R·u)" in the first place.
 * Writing \frac{1}{1+\theta}\cdot e^{-Ru} keeps the source legible.
 *
 * Supported: \frac, \sqrt, ^ and _ (single token or braced group), Greek
 * letters, common operators/relations, \left( \right), \text{...}, and
 * plain numbers/identifiers. Anything unrecognised renders as literal text
 * rather than throwing, so a typo degrades to readable output instead of a
 * blank component.
 */

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
  eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ",
  nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ",
  phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

const OPERATORS: Record<string, string> = {
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠",
  approx: "≈", equiv: "≡", sim: "∼", propto: "∝",
  to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒",
  infty: "∞", partial: "∂", nabla: "∇", int: "∫", sum: "Σ", prod: "Π",
  in: "∈", notin: "∉", subset: "⊂", cup: "∪", cap: "∩",
  ldots: "…", cdots: "⋯", forall: "∀", exists: "∃",
};

/** Multi-letter function names that should render upright, not italic. */
const FUNCTIONS = new Set([
  "ln", "log", "exp", "sin", "cos", "tan", "min", "max", "det",
  "lim", "sup", "inf", "arg", "gcd", "Var", "Cov", "Pr",
]);

type Token = { kind: "cmd" | "sym" | "num" | "ident" | "open" | "close" | "script"; value: string };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      let j = i + 1;
      while (j < src.length && /[A-Za-z]/.test(src[j])) j++;
      if (j === i + 1) {
        // Escaped punctuation, e.g. \{ or \%
        out.push({ kind: "sym", value: src[j] ?? "" });
        i = j + 1;
      } else {
        out.push({ kind: "cmd", value: src.slice(i + 1, j) });
        i = j;
      }
      continue;
    }
    if (c === "{") { out.push({ kind: "open", value: "{" }); i++; continue; }
    if (c === "}") { out.push({ kind: "close", value: "}" }); i++; continue; }
    if (c === "^" || c === "_") { out.push({ kind: "script", value: c }); i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ kind: "num", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      out.push({ kind: "ident", value: c });
      i++;
      continue;
    }
    out.push({ kind: "sym", value: c });
    i++;
  }
  return out;
}

let keySeed = 0;
const k = () => `m${keySeed++}`;

/** Parses a run of tokens into MathML nodes until `stop` (or the end). */
function parseRun(tokens: Token[], pos: { i: number }, stopAtClose: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  while (pos.i < tokens.length) {
    if (stopAtClose && tokens[pos.i].kind === "close") break;
    const node = parseAtomWithScripts(tokens, pos);
    if (node === null) break;
    nodes.push(node);
  }
  return nodes;
}

/** One atom plus any ^ / _ attached to it. */
function parseAtomWithScripts(tokens: Token[], pos: { i: number }): ReactNode | null {
  const base = parseAtom(tokens, pos);
  if (base === null) return null;

  let sup: ReactNode | null = null;
  let sub: ReactNode | null = null;
  while (pos.i < tokens.length && tokens[pos.i].kind === "script") {
    const which = tokens[pos.i].value;
    pos.i++;
    const arg = parseAtom(tokens, pos);
    if (which === "^") sup = arg;
    else sub = arg;
  }

  if (sup !== null && sub !== null) {
    return <msubsup key={k()}><mrow>{base}</mrow><mrow>{sub}</mrow><mrow>{sup}</mrow></msubsup>;
  }
  if (sup !== null) return <msup key={k()}><mrow>{base}</mrow><mrow>{sup}</mrow></msup>;
  if (sub !== null) return <msub key={k()}><mrow>{base}</mrow><mrow>{sub}</mrow></msub>;
  return base;
}

function parseGroup(tokens: Token[], pos: { i: number }): ReactNode[] {
  if (pos.i < tokens.length && tokens[pos.i].kind === "open") {
    pos.i++; // consume {
    const inner = parseRun(tokens, pos, true);
    if (pos.i < tokens.length && tokens[pos.i].kind === "close") pos.i++; // consume }
    return inner;
  }
  const single = parseAtom(tokens, pos);
  return single === null ? [] : [single];
}

function parseAtom(tokens: Token[], pos: { i: number }): ReactNode | null {
  if (pos.i >= tokens.length) return null;
  const t = tokens[pos.i];

  if (t.kind === "close") return null;

  if (t.kind === "open") {
    const inner = parseGroup(tokens, pos);
    return <mrow key={k()}>{inner}</mrow>;
  }

  if (t.kind === "num") { pos.i++; return <mn key={k()}>{t.value}</mn>; }

  if (t.kind === "ident") {
    // Greedily join letters into a known function name (ln, log, max...).
    let j = pos.i, word = "";
    while (j < tokens.length && tokens[j].kind === "ident") { word += tokens[j].value; j++; }
    for (let len = word.length; len >= 2; len--) {
      const cand = word.slice(0, len);
      if (FUNCTIONS.has(cand)) {
        pos.i += len;
        return <mi key={k()} mathvariant="normal">{cand}</mi>;
      }
    }
    pos.i++;
    return <mi key={k()}>{t.value}</mi>;
  }

  if (t.kind === "sym") { pos.i++; return <mo key={k()}>{t.value}</mo>; }

  if (t.kind === "cmd") {
    const name = t.value;
    pos.i++;

    if (name === "frac" || name === "dfrac" || name === "tfrac") {
      const num = parseGroup(tokens, pos);
      const den = parseGroup(tokens, pos);
      return <mfrac key={k()}><mrow>{num}</mrow><mrow>{den}</mrow></mfrac>;
    }
    if (name === "sqrt") {
      const arg = parseGroup(tokens, pos);
      return <msqrt key={k()}><mrow>{arg}</mrow></msqrt>;
    }
    // Accents: MathML puts the mark above the base with <mover>.
    const ACCENTS: Record<string, string> = {
      ddot: "¨", dot: "˙", hat: "^", bar: "‾", vec: "→", tilde: "~",
    };
    if (ACCENTS[name]) {
      const arg = parseGroup(tokens, pos);
      return (
        <mover key={k()} accent="true">
          <mrow>{arg}</mrow>
          <mo stretchy="false">{ACCENTS[name]}</mo>
        </mover>
      );
    }
    if (name === "mathcal" || name === "mathbb" || name === "mathbf" || name === "mathit") {
      // Script/blackboard/bold variants: MathML expresses these as a
      // mathvariant on the identifier rather than a wrapper element.
      const variant =
        name === "mathcal" ? "script" : name === "mathbb" ? "double-struck" : name === "mathbf" ? "bold" : "italic";
      const arg = parseGroup(tokens, pos);
      return (
        <mi key={k()} mathvariant={variant}>
          {flattenText(arg)}
        </mi>
      );
    }
    if (name === "text" || name === "mathrm" || name === "operatorname") {
      const arg = parseGroup(tokens, pos);
      // Collapse the group back to its literal characters.
      const flat = flattenText(arg);
      return <mtext key={k()}>{flat}</mtext>;
    }
    if (name === "left" || name === "right") {
      // Render the delimiter that follows as a plain operator.
      if (pos.i < tokens.length) {
        const d = tokens[pos.i];
        pos.i++;
        const ch = d.value === "." ? "" : d.value;
        return ch ? <mo key={k()}>{ch}</mo> : <Fragment key={k()} />;
      }
      return <Fragment key={k()} />;
    }
    if (GREEK[name]) return <mi key={k()}>{GREEK[name]}</mi>;
    if (OPERATORS[name]) return <mo key={k()}>{OPERATORS[name]}</mo>;
    if (FUNCTIONS.has(name)) return <mi key={k()} mathvariant="normal">{name}</mi>;
    if (name === "quad") return <mspace key={k()} style={{ width: "1em" }} />;
    if (name === "," || name === ";") return <mspace key={k()} style={{ width: "0.25em" }} />;

    // Unknown command: show it literally rather than silently dropping it.
    return <mtext key={k()}>{`\\${name}`}</mtext>;
  }

  pos.i++;
  return null;
}

/** Recovers the plain characters inside a \text{...} group. */
function flattenText(nodes: ReactNode[]): string {
  let out = "";
  const walk = (n: unknown): void => {
    if (n === null || n === undefined || typeof n === "boolean") return;
    if (typeof n === "string" || typeof n === "number") { out += String(n); return; }
    if (Array.isArray(n)) { n.forEach(walk); return; }
    const el = n as { props?: { children?: unknown } };
    if (el.props?.children !== undefined) walk(el.props.children);
  };
  nodes.forEach(walk);
  return out;
}

export function texToMathML(src: string): ReactNode[] {
  const tokens = tokenize(src);
  return parseRun(tokens, { i: 0 }, false);
}

/**
 * Renders a TeX-subset string as MathML.
 * `block` centres it on its own line; otherwise it flows inline with text.
 */
export default function TeX({
  children,
  block = false,
  className,
}: {
  children: string;
  block?: boolean;
  className?: string;
}) {
  const body = texToMathML(children);
  const cls = ["tex-math", block ? "tex-block" : "tex-inline", className].filter(Boolean).join(" ");
  return (
    <math className={cls} display={block ? "block" : "inline"} xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>{body}</mrow>
    </math>
  );
}
