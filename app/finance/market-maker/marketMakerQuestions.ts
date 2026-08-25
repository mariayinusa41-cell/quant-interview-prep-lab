// Question bank for the market-maker game. Every question is written to be
// about the round actually being played — it takes the live half-spread,
// skew, fair value, current inventory, and this round's flow signal as
// input, so the number (or move) you're asked about is the one you're
// actually facing. Same id/exclude repeat-avoidance pattern used by the
// other casino games' question banks.

import {
  P_INFORMED,
  INFORMED_MOVE,
  FLATTEN_COST_PER_UNIT,
  breakevenHalfSpread,
  evPerFill,
  evPerRound,
  fillProbability,
} from "./marketMakerMath";

export type MMQuizContext = {
  half: number;
  skew: number;
  fair: number;
  inventory: number;
  signal: "buy" | "sell" | null;
};

export type MMQuestionInstance = {
  id: string;
  topicLabel: string;
  prompt: (ctx: MMQuizContext) => string;
  answer: (ctx: MMQuizContext) => { decimal: number; tolerance: number; display: string };
  explanation: (ctx: MMQuizContext) => string;
  choices?: string[];
};

function fmtTicks(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const QUESTION_BANK: MMQuestionInstance[] = [
  {
    id: "ev-fill",
    topicLabel: "Expected value",
    prompt: (ctx) =>
      `Half-spread ${ctx.half}, skew ${fmtTicks(ctx.skew)}. ${(P_INFORMED * 100).toFixed(0)}% of flow is informed and moves the price ${INFORMED_MOVE} ticks against you; the rest is noise and averages zero move. What's your expected P&L IF this quote fills, in ticks?`,
    answer: (ctx) => ({ decimal: evPerFill(ctx.half, ctx.skew), tolerance: 0.05, display: fmtTicks(evPerFill(ctx.half, ctx.skew)) }),
    explanation: (ctx) =>
      `E[P&L | fill] = half-spread + skew − P(informed) × informed move = ${ctx.half} + (${fmtTicks(ctx.skew)}) − ${P_INFORMED} × ${INFORMED_MOVE} = ${fmtTicks(evPerFill(ctx.half, ctx.skew))} ticks.`,
  },
  {
    id: "ev-round",
    topicLabel: "Expected value",
    prompt: (ctx) =>
      `At a ${ctx.half}-tick half-spread your fill probability is ${(fillProbability(ctx.half) * 100).toFixed(0)}% (skew doesn't change fill odds, only price). What's your expected P&L for the ROUND, in ticks?`,
    answer: (ctx) => ({ decimal: evPerRound(ctx.half, ctx.skew), tolerance: 0.05, display: fmtTicks(evPerRound(ctx.half, ctx.skew)) }),
    explanation: (ctx) =>
      `E[P&L] = P(fill) × E[P&L | fill] = ${fillProbability(ctx.half).toFixed(2)} × ${fmtTicks(evPerFill(ctx.half, ctx.skew))} = ${fmtTicks(evPerRound(ctx.half, ctx.skew))} ticks.`,
  },
  {
    id: "breakeven",
    topicLabel: "Adverse selection",
    prompt: () =>
      `Informed flow is ${(P_INFORMED * 100).toFixed(0)}% of rounds and costs you ${INFORMED_MOVE} ticks each time. Ignoring skew and noise, what's the minimum half-spread that breaks even against informed flow alone?`,
    answer: () => ({ decimal: breakevenHalfSpread(), tolerance: 0.05, display: breakevenHalfSpread().toFixed(2) }),
    explanation: () =>
      `Breakeven half-spread = P(informed) × informed move = ${P_INFORMED} × ${INFORMED_MOVE} = ${breakevenHalfSpread().toFixed(2)} ticks. Quote tighter than that with no skew and informed flow alone eats your edge.`,
  },
  {
    id: "signal-skew",
    topicLabel: "Reading order flow",
    choices: ["Skew up", "Skew down", "No change"],
    prompt: (ctx) =>
      `Your flow signal this round is ${ctx.signal ? ctx.signal.toUpperCase() + " LEAN" : "quiet"}. A BUY lean means informed flow is likely about to lift your ask. Which way should you skew to protect yourself?`,
    answer: () => ({ decimal: 0, tolerance: 0, display: "Skew up" }),
    explanation: () =>
      `Skew up. Raising both sides raises your ask, so if an informed buyer lifts it anyway, you're compensated closer to where the price is actually headed - and it also makes your bid less attractive, so you're less likely to also buy into a rising market. (Mirror logic applies to a SELL lean: skew down.)`,
  },
  {
    id: "inventory-skew",
    topicLabel: "Inventory risk",
    choices: ["Skew up", "Skew down", "No change"],
    prompt: (ctx) =>
      `Your inventory is ${ctx.inventory >= 0 ? "+" : ""}${ctx.inventory} (${ctx.inventory > 0 ? "long" : ctx.inventory < 0 ? "short" : "flat"}), no signal right now. Which way should you skew to work that position back toward flat?`,
    answer: (ctx) => ({ decimal: 0, tolerance: 0, display: ctx.inventory > 0 ? "Skew down" : ctx.inventory < 0 ? "Skew up" : "No change" }),
    explanation: (ctx) =>
      ctx.inventory > 0
        ? "You're long, so you want to sell more and buy less: skew down. That lowers your ask (more attractive to buyers, who reduce your position) and lowers your bid (less attractive for you to buy even more)."
        : ctx.inventory < 0
          ? "You're short, so you want to buy more and sell less: skew up. That raises your bid (more attractive to sellers, who reduce your position) and raises your ask (less attractive for you to sell even more)."
          : "You're already flat - no inventory risk to work off, so there's no skew case to make on inventory grounds alone.",
  },
  {
    id: "flatten-cost",
    topicLabel: "Closing risk",
    prompt: (ctx) =>
      `You end the session holding ${Math.abs(ctx.inventory)} unit(s) of inventory. Closing out costs ${FLATTEN_COST_PER_UNIT} ticks per unit (crossing the spread to trade out). What's your total flatten cost, in ticks?`,
    answer: (ctx) => ({
      decimal: Math.abs(ctx.inventory) * FLATTEN_COST_PER_UNIT,
      tolerance: 0.01,
      display: fmtTicks(Math.abs(ctx.inventory) * FLATTEN_COST_PER_UNIT),
    }),
    explanation: (ctx) =>
      `Flatten cost = |inventory| × cost per unit = ${Math.abs(ctx.inventory)} × ${FLATTEN_COST_PER_UNIT} = ${fmtTicks(Math.abs(ctx.inventory) * FLATTEN_COST_PER_UNIT)} ticks. Carrying a position into the close isn't free - it's a real reason to trade back toward flat before time runs out.`,
  },
  {
    id: "parity-bid",
    topicLabel: "Put-call parity",
    prompt: (ctx) =>
      `The stock (this game's fair value) is at ${ctx.fair}, r = 0. An at-the-money European put is worth $5.50. You quote a ${ctx.half}-cent half-spread on the matching call. What's your bid?`,
    answer: (ctx) => {
      const callFair = 5.5; // c - p = S - K, and K = S at-the-money, so c = p here regardless of the stock's level
      const bid = callFair - ctx.half / 100;
      return { decimal: bid, tolerance: 0.001, display: fmtUsd(bid) };
    },
    explanation: (ctx) =>
      `Put-call parity: c − p = S − K. At-the-money means K = S, so that side is zero and c = p = $5.50 regardless of where the stock sits. Subtract your ${ctx.half}-cent half-spread: bid = ${fmtUsd(5.5 - ctx.half / 100)}.`,
  },
  {
    id: "straddle-ask",
    topicLabel: "Option portfolios",
    prompt: (ctx) =>
      `You're market-making a straddle (long call + long put) on the same stock. Fair value: call = $3.20, put = $2.80. You quote a ${ctx.half}-cent half-spread on the package. What's your ask?`,
    answer: (ctx) => {
      const straddleFair = 3.2 + 2.8;
      const ask = straddleFair + ctx.half / 100;
      return { decimal: ask, tolerance: 0.001, display: fmtUsd(ask) };
    },
    explanation: (ctx) =>
      `A straddle's fair value is just call + put = $3.20 + $2.80 = $6.00. Add your ${ctx.half}-cent half-spread: ask = ${fmtUsd(3.2 + 2.8 + ctx.half / 100)}.`,
  },
  {
    id: "delta-hedge",
    topicLabel: "The Greeks",
    prompt: (ctx) =>
      `You buy 1 call contract (100 shares) on your bid, capturing your ${ctx.half}-cent half-spread edge. Delta is 0.50, so you hedge by selling 50 shares, paying a $0.01/share crossing spread on the hedge. What's your net edge, in dollars?`,
    answer: (ctx) => {
      const grossEdge = (ctx.half / 100) * 100; // half-spread in dollars/share * 100 shares
      const hedgeCost = 50 * 0.01;
      const net = grossEdge - hedgeCost;
      return { decimal: net, tolerance: 0.001, display: fmtUsd(net) };
    },
    explanation: (ctx) => {
      const grossEdge = (ctx.half / 100) * 100;
      return `Gross edge = ${ctx.half} cents × 100 shares = ${fmtUsd(grossEdge)}. Hedging 50 deltas costs 50 × $0.01 = $0.50. Net edge = ${fmtUsd(grossEdge - 0.5)} - hedging isn't free, it eats into the edge you just captured.`;
    },
  },
];

export function pickMMQuestion(exclude?: string): MMQuestionInstance {
  const pool = exclude ? QUESTION_BANK.filter((q) => q.id !== exclude) : QUESTION_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}
