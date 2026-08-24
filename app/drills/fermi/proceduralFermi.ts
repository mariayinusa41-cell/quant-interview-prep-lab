// Procedurally generated Fermi questions. Each "template" below picks a
// random row out of a small matrix of real-world numbers and plugs it into a
// question/explanation string, so the pool of prompts is effectively
// unbounded instead of being capped at the hand-written list in
// fermiQuestions.ts. Every template still produces a single defensible
// answer plus a worked Fermi-style explanation, same as the static set.

import type { FermiQuestion } from "./fermiQuestions";

// --- VARIABLE MATRICES ---

const platforms = [
  { name: "Google", action: "searches", dailyPerUser: 3.5, users: 4.8e9, usersStr: "4.8B" },
  { name: "YouTube", action: "hours of video watched", dailyPerUser: 1.2, users: 2.7e9, usersStr: "2.7B" },
  { name: "WhatsApp", action: "messages sent", dailyPerUser: 50, users: 2.7e9, usersStr: "2.7B" },
  { name: "TikTok", action: "videos scrolled", dailyPerUser: 150, users: 1.6e9, usersStr: "1.6B" },
  { name: "Spotify", action: "songs streamed", dailyPerUser: 25, users: 600e6, usersStr: "600M" },
];

const timeframes = [
  { name: "day", days: 1, daysStr: "1" },
  { name: "week", days: 7, daysStr: "7" },
  { name: "year", days: 365, daysStr: "365" },
];

const billionaires = [
  { name: "Sheila Johnson", worth: 250e6, worthStr: "$250M" },
  { name: "Rihanna", worth: 1.1e9, worthStr: "$1.1B" },
  { name: "LeBron James", worth: 1.2e9, worthStr: "$1.2B" },
  { name: "Aliko Dangote", worth: 17e9, worthStr: "$17B" },
];

const bills = [
  { denom: 1, value: 1, name: "$1 bills" },
  { denom: 20, value: 20, name: "$20 bills" },
  { denom: 100, value: 100, name: "$100 bills" },
];

const containers = [
  { name: "a standard school bus", vol: 50, volStr: "50" },
  { name: "an Olympic swimming pool", vol: 2500, volStr: "2,500" },
  { name: "a Boeing 747 interior", vol: 1000, volStr: "1,000" },
  { name: "a typical two-car garage", vol: 85, volStr: "85" },
  { name: "the Empire State Building", vol: 1_040_000, volStr: "1.04 million" },
];

const objects = [
  { name: "golf balls", vol: 4.2e-5, volStr: "4.2 × 10⁻⁵" },
  { name: "tennis balls", vol: 1.57e-4, volStr: "1.57 × 10⁻⁴" },
  { name: "baseballs", vol: 2.1e-4, volStr: "2.1 × 10⁻⁴" },
  { name: "basketballs", vol: 7.1e-3, volStr: "7.1 × 10⁻³" },
  { name: "marbles", vol: 5.2e-7, volStr: "5.2 × 10⁻⁷" },
];

const animals = [
  { name: "human", bpm: 72, lifespan: 75 },
  { name: "dog", bpm: 100, lifespan: 13 },
  { name: "blue whale", bpm: 15, lifespan: 80 },
  { name: "mouse", bpm: 500, lifespan: 2 },
  { name: "elephant", bpm: 30, lifespan: 60 },
];

const populations = [
  { name: "New York City", pop: 8.5e6, popStr: "8.5M" },
  { name: "the United States", pop: 330e6, popStr: "330M" },
  { name: "Tokyo", pop: 37e6, popStr: "37M" },
  { name: "the world", pop: 8e9, popStr: "8B" },
];

const dailyActions = [
  { action: "cups of coffee are consumed", perCapita: 1.2, unit: "cups" },
  { action: "text messages are sent", perCapita: 30, unit: "messages" },
  { action: "gallons of water are flushed down toilets", perCapita: 15, unit: "gallons" },
];

// --- GENERATOR UTILS ---

const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const generateId = () => `proc-${Math.random().toString(36).slice(2, 11)}`;

// --- QUESTION TEMPLATES ---

// Difficulty 1: single-step tech scale (users × rate × time).
function generateTechThroughputQuestion(): FermiQuestion {
  const platform = getRandom(platforms);
  const timeframe = getRandom(timeframes);

  const rawAnswer = platform.users * platform.dailyPerUser * timeframe.days;
  const answer = Number(rawAnswer.toPrecision(2));

  return {
    id: generateId(),
    question: `How many ${platform.action} happen on ${platform.name} in a typical ${timeframe.name}?`,
    answer,
    unit: platform.action,
    explanation: `Estimated ${platform.name} active users ≈ ${platform.usersStr}. Estimated ${platform.action} per user per day ≈ ${platform.dailyPerUser}. Days in a ${timeframe.name} = ${timeframe.daysStr}. Calculation: ${platform.usersStr} × ${platform.dailyPerUser} × ${timeframe.daysStr} ≈ ${answer.toExponential(1)}.`,
    category: "tech",
    difficulty: 1,
  };
}

// Difficulty 2: physical scale of wealth (dimensional analysis).
function generateBillionaireStackQuestion(): FermiQuestion {
  const person = getRandom(billionaires);
  const bill = getRandom(bills);

  // A US paper bill is ~0.1mm thick (0.0001 meters). 1 km = 1000 meters.
  const billThicknessMeters = 0.0001;
  const totalBills = person.worth / bill.value;
  const heightInMeters = totalBills * billThicknessMeters;
  const heightInKm = heightInMeters / 1000;

  const answer = Number(heightInKm.toPrecision(2));

  return {
    id: generateId(),
    question: `If you stacked ${person.name}'s net worth entirely in ${bill.name}, how tall would the stack be in kilometers?`,
    answer,
    unit: "km",
    explanation: `${person.name}'s net worth ≈ ${person.worthStr}. Total ${bill.name} needed: ${person.worthStr} / ${bill.value} = ${(totalBills / 1e6).toFixed(1)} million bills. A US bill is ~0.1mm (10⁻⁴ m) thick. Height in meters: ${(totalBills / 1e6).toFixed(1)}M × 10⁻⁴ ≈ ${heightInMeters.toLocaleString()} m. Divide by 1,000 for km: ≈ ${answer.toLocaleString()} km.`,
    category: "pop-culture",
    difficulty: 2,
  };
}

// Difficulty 3: server/storage scale (a more involved unit conversion).
function generateDataStorageQuestion(): FermiQuestion {
  const timeframe = getRandom(timeframes);

  // YouTube 1080p video is roughly 1.5 GB per hour. 1 Petabyte = 1,000,000 GB.
  const gbPerHour = 1.5;
  const hoursPerDay = 1e9; // ~1 billion hours of video watched daily

  const totalGB = hoursPerDay * timeframe.days * gbPerHour;
  const totalPetabytes = totalGB / 1e6;
  const answer = Number(totalPetabytes.toPrecision(2));

  return {
    id: generateId(),
    question: `If every hour of YouTube watched in a ${timeframe.name} was downloaded in 1080p, how many Petabytes of storage would it require?`,
    answer,
    unit: "Petabytes",
    explanation: `Hours watched per day ≈ 1 billion. Days in a ${timeframe.name} = ${timeframe.daysStr}. 1080p video uses ~1.5 GB/hour. Total data in GB: 1B × ${timeframe.daysStr} × 1.5 ≈ ${(totalGB / 1e9).toFixed(1)} billion GB. 1 Petabyte = 1 million GB. Calculation: ${(totalGB / 1e9).toFixed(1)}B / 1M ≈ ${answer.toLocaleString()} PB.`,
    category: "tech",
    difficulty: 3,
  };
}

// Difficulty 2: packing volume (container ÷ object, with sphere packing).
function generateVolumeQuestion(): FermiQuestion {
  const container = getRandom(containers);
  const obj = getRandom(objects);
  const packingEfficiency = 0.64; // random sphere packing limit

  const rawAnswer = (container.vol * packingEfficiency) / obj.vol;
  const answer = Number(rawAnswer.toPrecision(2));

  return {
    id: generateId(),
    question: `How many ${obj.name} fit inside ${container.name}?`,
    answer,
    unit: obj.name,
    explanation: `Volume of ${container.name} ≈ ${container.volStr} m³. Volume of one ${obj.name.slice(0, -1)} ≈ ${obj.volStr} m³. Sphere packing efficiency is ~64%. Calculation: (${container.volStr} × 0.64) / ${obj.volStr} ≈ ${answer.toLocaleString()}.`,
    category: "everyday",
    difficulty: 2,
  };
}

// Difficulty 1: heartbeat count (bpm × lifespan).
function generateHeartbeatQuestion(): FermiQuestion {
  const animal = getRandom(animals);

  const minutesInYear = 60 * 24 * 365.25;
  const rawAnswer = animal.bpm * minutesInYear * animal.lifespan;
  const answer = Number(rawAnswer.toPrecision(2));

  return {
    id: generateId(),
    question: `How many heartbeats does an average ${animal.name} have in a lifetime?`,
    answer,
    unit: "beats",
    explanation: `Average ${animal.name} heart rate ≈ ${animal.bpm} bpm. Lifespan ≈ ${animal.lifespan} years. Minutes in a year ≈ 525,600. Calculation: ${animal.bpm} × 525,600 × ${animal.lifespan} ≈ ${answer.toLocaleString()}.`,
    category: "biology",
    difficulty: 1,
  };
}

// Difficulty 1: per-capita daily consumption (population × rate).
function generateConsumptionQuestion(): FermiQuestion {
  const pop = getRandom(populations);
  const action = getRandom(dailyActions);

  const rawAnswer = pop.pop * action.perCapita;
  const answer = Number(rawAnswer.toPrecision(2));

  return {
    id: generateId(),
    question: `How many ${action.action} per day in ${pop.name}?`,
    answer,
    unit: action.unit,
    explanation: `Population of ${pop.name} ≈ ${pop.popStr}. Estimated per capita usage ≈ ${action.perCapita} ${action.unit}/day. Calculation: ${pop.popStr} × ${action.perCapita} ≈ ${answer.toLocaleString()}.`,
    category: "economics",
    difficulty: 1,
  };
}

// --- MASTER GENERATOR ---

const templates = [
  generateTechThroughputQuestion,
  generateBillionaireStackQuestion,
  generateDataStorageQuestion,
  generateVolumeQuestion,
  generateHeartbeatQuestion,
  generateConsumptionQuestion,
];

export function getProceduralFermiQuestion(): FermiQuestion {
  return getRandom(templates)();
}

// Generates a batch of `count` procedural questions, deduped by question
// text so a single deck never shows the same prompt twice.
export function getProceduralFermiQuestions(count: number): FermiQuestion[] {
  const out: FermiQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 20) {
    guard++;
    const q = getProceduralFermiQuestion();
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    out.push(q);
  }
  return out;
}
