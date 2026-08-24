// Fermi estimation questions for quant interview prep.
// Each question has a target answer (order of magnitude), an accepted range
// (within 1 order of magnitude by default), and a short explanation.
//
// This file has two layers:
//   1. `coreFermiQuestions` — hand-curated, individually vetted prompts.
//   2. `buildMatrixQuestions()` — a small set of question *templates*, each
//      crossed against a matrix of real-world entities/rates, so a handful
//      of templates expands into a few hundred distinct prompts without
//      hand-writing every one.
// `fermiQuestions` (the default export used by the game) is the two
// combined.

export type FermiCategory =
  | "everyday"
  | "physics"
  | "geography"
  | "economics"
  | "biology"
  | "engineering"
  | "tech"
  | "pop-culture";

export type FermiQuestion = {
  id: string | number;
  question: string;
  answer: number;
  unit: string;
  explanation: string;
  category: FermiCategory;
  difficulty: 1 | 2 | 3;
};

// ==========================================
// 1. CORE CURATED QUANT INTERVIEW QUESTIONS
// ==========================================

export const coreFermiQuestions: FermiQuestion[] = [
  // --- EVERYDAY (Warm-up & Interview) ---
  {
    id: 1,
    question: "How many piano tuners are there in Chicago?",
    answer: 225,
    unit: "tuners",
    explanation: "~2.7M people -> ~1M households -> ~100k pianos (10%). Each tuned ~1x/yr. Tuner does ~4/day * 250 days = 1,000/yr -> ~100-250 tuners.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 2,
    question: "How many golf balls fit inside a school bus?",
    answer: 500_000,
    unit: "golf balls",
    explanation: "Bus interior ≈ 50 m³. Golf ball volume ≈ 4.2e-5 m³. Packing efficiency ~64%. (50 * 0.64) / 4.2e-5 ≈ 500,000.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 3,
    question: "How many gas stations are there in the United States?",
    answer: 150_000,
    unit: "stations",
    explanation: "~280M cars, 1 fill/wk. Station has ~8 pumps, 20 cars/pump/day -> 1,120 fills/wk. 280M / 1,120 ≈ 150,000.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 4,
    question: "How many tennis balls fit in a typical 5m x 4m x 3m room?",
    answer: 240_000,
    unit: "tennis balls",
    explanation: "Room volume = 60 m³. Ball diameter = 6.7 cm -> volume ≈ 1.57e-4 m³. (60 * 0.64) / 1.57e-4 ≈ 244,000.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 5,
    question: "How many words does an average person speak in a day?",
    answer: 16_000,
    unit: "words",
    explanation: "Average speech rate ≈ 130 words/min. ~2 hours of active conversation/day = 120 min. 120 * 130 ≈ 15,600.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 6,
    question: "How many slices of pizza are consumed in the US per day?",
    answer: 100_000_000,
    unit: "slices",
    explanation: "~330M people. ~1 in 10 eats pizza on any day (33M people), averaging 3 slices each -> ~100M slices.",
    category: "everyday",
    difficulty: 1,
  },
  {
    id: 7,
    question: "How many barbers and hairstylists are currently working in New York City?",
    answer: 25_000,
    unit: "stylists",
    explanation: "8.5M people get ~8 cuts/yr = 68M cuts. Stylist does ~10/day * 260 days = 2,600 cuts/yr. 68M / 2,600 ≈ 26,000.",
    category: "everyday",
    difficulty: 2,
  },
  {
    id: 8,
    question: "How many passenger elevators are in service in New York City?",
    answer: 70_000,
    unit: "elevators",
    explanation: "NYC has ~1M buildings. ~70,000 buildings with 4+ floors with an average of 1-2 elevators -> ~70k.",
    category: "everyday",
    difficulty: 2,
  },
  {
    id: 9,
    question: "How many cups of coffee are consumed annually worldwide?",
    answer: 800_000_000_000,
    unit: "cups",
    explanation: "~2.25 billion cups consumed daily globally. 2.25B * 365.25 ≈ 820 billion cups/year.",
    category: "everyday",
    difficulty: 2,
  },
  {
    id: 10,
    question: "How many diapers are used in the US annually?",
    answer: 18_000_000_000,
    unit: "diapers",
    explanation: "~3.6M births/yr * 2.5 yrs in diapers = 9M infants. ~5.5 diapers/day = 2,000/yr. 9M * 2,000 ≈ 18 billion.",
    category: "everyday",
    difficulty: 2,
  },

  // --- POP CULTURE & TECH (Interview & Hard) ---
  {
    id: 11,
    question: "How many total views happen on TikTok globally in a single 24-hour day?",
    answer: 1_000_000_000_000,
    unit: "views",
    explanation: "~1.2B daily active users, each watching an average of ~800 short videos/day -> ~1 trillion daily views.",
    category: "pop-culture",
    difficulty: 2,
  },
  {
    id: 12,
    question: "If you stacked Taylor Swift's $1.1B net worth in $100 bills, how tall is the stack in meters?",
    answer: 1_100,
    unit: "meters",
    explanation: "$1.1B / $100 = 11 million bills. A single US bill is 0.1 mm (1e-4 m) thick. 11M * 1e-4 = 1,100 m (~1.1 km).",
    category: "pop-culture",
    difficulty: 2,
  },
  {
    id: 13,
    question: "How many hours of music are streamed on Spotify worldwide each day?",
    answer: 600_000_000,
    unit: "hours",
    explanation: "~600M active listeners averaging ~1 hour of listening per day = ~600M hours/day.",
    category: "tech",
    difficulty: 1,
  },
  {
    id: 14,
    question: "How many Google search queries are executed per second globally?",
    answer: 100_000,
    unit: "searches/sec",
    explanation: "~8.5 billion searches per day / 86,400 seconds in a day ≈ 98,400 searches/second.",
    category: "tech",
    difficulty: 1,
  },
  {
    id: 15,
    question: "How many iPhone units has Apple sold cumulative since 2007?",
    answer: 2_500_000_000,
    unit: "iPhones",
    explanation: "Apple sells ~220M iPhones/yr over the past decade, plus early ramp-up -> ~2.5 billion lifetime units.",
    category: "tech",
    difficulty: 2,
  },
  {
    id: 16,
    question: "If all 24-hour YouTube uploads were stored on 1TB hard drives, how many drives are needed daily?",
    answer: 50_000,
    unit: "drives",
    explanation: "~500 hours uploaded/minute = 720,000 hours/day. At ~70 GB/hour raw compressed video -> ~50 Petabytes/day = 50,000 1TB drives.",
    category: "tech",
    difficulty: 3,
  },
  {
    id: 17,
    question: "How many Uber trips are completed globally every single minute?",
    answer: 20_000,
    unit: "trips/min",
    explanation: "Uber logs ~28 million trips/day. 28,000,000 / 1,440 minutes in a day ≈ 19,400 trips/min.",
    category: "tech",
    difficulty: 2,
  },
  {
    id: 18,
    question: "How much power (in Megawatts) does the global Bitcoin network consume continuously?",
    answer: 18_000,
    unit: "Megawatts",
    explanation: "Consumes ~150 TWh/year. (150e12 Wh) / (8,760 hours/yr) ≈ 17.1 GW = 17,100 MW.",
    category: "tech",
    difficulty: 3,
  },

  // --- ECONOMICS & FINANCE (Interview & Hard) ---
  {
    id: 19,
    question: "What is the total value of all physical US currency (paper + coins) in circulation (in USD)?",
    answer: 2_300_000_000_000,
    unit: "USD",
    explanation: "Federal Reserve records ~2.3 trillion USD in physical circulation, heavily weighted in $100 banknotes held overseas.",
    category: "economics",
    difficulty: 2,
  },
  {
    id: 20,
    question: "How many credit card transactions occur per second on the Visa network on average?",
    answer: 7_000,
    unit: "transactions/sec",
    explanation: "Visa processes ~220 billion transactions/yr. 220B / (365.25 * 86,400) ≈ 6,970 tx/sec (burst capacity is 65k+).",
    category: "economics",
    difficulty: 2,
  },
  {
    id: 21,
    question: "How many packages does Amazon ship per day in the United States?",
    answer: 20_000_000,
    unit: "packages",
    explanation: "Amazon ships ~6 billion packages/year in the US. 6B / 365 ≈ 16.4M - 20M daily.",
    category: "economics",
    difficulty: 2,
  },
  {
    id: 22,
    question: "How many commercial banks currently operate in the United States?",
    answer: 4_500,
    unit: "banks",
    explanation: "FDIC-insured institutions have consolidated from ~14,000 in the 1980s down to ~4,400-4,600 today.",
    category: "economics",
    difficulty: 2,
  },
  {
    id: 23,
    question: "What is the total global annual revenue of all movie box offices combined (in USD)?",
    answer: 35_000_000_000,
    unit: "USD",
    explanation: "US domestic box office is ~$9-11B, representing ~30% of global receipts -> $33B-$38B global.",
    category: "economics",
    difficulty: 2,
  },

  // --- PHYSICS & ENGINEERING (Interview & Hard) ---
  {
    id: 24,
    question: "What is the total mass of the Earth's atmosphere in kilograms?",
    answer: 5.15e18,
    unit: "kg",
    explanation: "Pressure = 10^5 N/m². Earth surface area = 4*pi*R² ≈ 5.1e14 m². Force = 5.1e19 N. Divide by g=9.8 -> 5.15e18 kg.",
    category: "physics",
    difficulty: 2,
  },
  {
    id: 25,
    question: "How many atoms are in an average 70 kg human body?",
    answer: 7e27,
    unit: "atoms",
    explanation: "70 kg body ≈ 70% water (H2O, 18 g/mol, 3 atoms/mol). (49,000/18)*6e23*3 ≈ 4.9e27 water atoms + organic matrix -> ~7e27.",
    category: "physics",
    difficulty: 2,
  },
  {
    id: 26,
    question: "How many total photons hit your eyeball per second in normal indoor daylight?",
    answer: 1e14,
    unit: "photons/sec",
    explanation: "Indoor illuminance ~500 lux ≈ 2 W/m². Pupil area (3 mm diam) ≈ 7e-6 m² -> Power ≈ 1.4e-5 W. Photon energy (green) ≈ 3.6e-19 J. (1.4e-5)/(3.6e-19) ≈ 4e13 - 1e14.",
    category: "physics",
    difficulty: 3,
  },
  {
    id: 27,
    question: "What is the kinetic energy of a Boeing 747 cruising at 900 km/h (in Joules)?",
    answer: 11_000_000_000,
    unit: "Joules",
    explanation: "Mass ≈ 350,000 kg. Velocity = 900 km/h = 250 m/s. KE = 0.5 * m * v² = 0.5 * 350,000 * (250)² = 1.09e10 J (11 GJ).",
    category: "physics",
    difficulty: 2,
  },
  {
    id: 28,
    question: "How many transistors are integrated on a single modern high-end smartphone SoC?",
    answer: 15_000_000_000,
    unit: "transistors",
    explanation: "Apple A17/A18 and Snapdragon 8 Gen series range from 15 billion to 20 billion transistors.",
    category: "engineering",
    difficulty: 2,
  },
  {
    id: 29,
    question: "How many dimples are on a standard regulation golf ball?",
    answer: 336,
    unit: "dimples",
    explanation: "Regulation balls have 300 to 500 dimples. The standard design by major brands is 336 (or 392).",
    category: "engineering",
    difficulty: 1,
  },
  {
    id: 30,
    question: "How many lines of code comprise the active Linux kernel repository?",
    answer: 35_000_000,
    unit: "lines",
    explanation: "Linux kernel v6.x contains ~35 million lines across core, arch, drivers, and file systems.",
    category: "engineering",
    difficulty: 2,
  },

  // --- BIOLOGY & GEOGRAPHY ---
  {
    id: 31,
    question: "How many bacterial cells live symbiotically in/on an average human body?",
    answer: 3.8e13,
    unit: "bacteria",
    explanation: "Modern microbiome census estimates ~3.8e13 bacterial cells, roughly 1:1 with human cells (3.0e13).",
    category: "biology",
    difficulty: 2,
  },
  {
    id: 32,
    question: "What is the total length of all uncoiled DNA strands in one human body (in meters)?",
    answer: 6e13,
    unit: "meters",
    explanation: "~2 m DNA/cell * ~3e13 human cells ≈ 6e13 meters (~400 times the distance from Earth to the Sun).",
    category: "biology",
    difficulty: 3,
  },
  {
    id: 33,
    question: "How many heartbeats does a domestic house cat have in a 15-year lifetime?",
    answer: 1_200_000_000,
    unit: "beats",
    explanation: "Cat resting heart rate ≈ 160 bpm. 160 * 525,600 min/yr * 15 yrs ≈ 1.26 billion beats.",
    category: "biology",
    difficulty: 1,
  },
  {
    id: 34,
    question: "How many total commercial aircraft are in the air worldwide at peak rush hour?",
    answer: 15_000,
    unit: "planes",
    explanation: "~100,000 flights/day, average flight time ~2.5 hrs = 250,000 flight hours / 24 hrs ≈ 10k-15k airborne at peak.",
    category: "geography",
    difficulty: 2,
  },
  {
    id: 35,
    question: "What is the discharge rate of the Amazon River into the Atlantic (in liters per second)?",
    answer: 200_000_000,
    unit: "liters/sec",
    explanation: "Amazon discharges ~209,000 m³/s. 1 m³ = 1,000 L -> ~2.09e8 liters/second.",
    category: "geography",
    difficulty: 3,
  },
  {
    id: 36,
    question: "What is the total length of all paved roadways in the United States (in km)?",
    answer: 4_400_000,
    unit: "km",
    explanation: "Total US road network is ~6.7 million km (~4.2M miles), of which ~65% is paved = ~4.4M km.",
    category: "geography",
    difficulty: 2,
  },
];

// =========================================================
// 2. EXPONENTIAL MATRIX EXPANSION (Generates Questions 37+)
// =========================================================

function buildMatrixQuestions(): FermiQuestion[] {
  const generated: FermiQuestion[] = [];
  let currentId = 37;

  // --- SUB-GENERATOR A: Tech & Social Consumption (Difficulty 1 & 2) ---
  const techEntities = [
    { name: "Netflix", metric: "hours streamed", dailyPerUser: 3.2, userCount: 270e6, cat: "pop-culture" as const },
    { name: "Instagram", metric: "photos and reels liked", dailyPerUser: 45, userCount: 1.4e9, cat: "pop-culture" as const },
    { name: "Reddit", metric: "upvotes cast", dailyPerUser: 12, userCount: 75e6, cat: "tech" as const },
    { name: "X (Twitter)", metric: "posts published", dailyPerUser: 1.8, userCount: 250e6, cat: "pop-culture" as const },
    { name: "Duolingo", metric: "language lessons completed", dailyPerUser: 2.1, userCount: 30e6, cat: "everyday" as const },
    { name: "Uber Eats", metric: "meals delivered", dailyPerUser: 0.15, userCount: 90e6, cat: "economics" as const },
    { name: "Robinhood", metric: "trades executed", dailyPerUser: 0.8, userCount: 11e6, cat: "economics" as const },
    { name: "Twitch", metric: "hours of live gameplay watched", dailyPerUser: 2.0, userCount: 35e6, cat: "pop-culture" as const },
    { name: "ChatGPT", metric: "prompts answered", dailyPerUser: 6, userCount: 180e6, cat: "tech" as const },
    { name: "Slack", metric: "messages sent", dailyPerUser: 32, userCount: 40e6, cat: "tech" as const },
  ];

  const intervals = [
    { label: "in a single day", factor: 1, diff: 1 as const },
    { label: "in a 30-day month", factor: 30, diff: 2 as const },
    { label: "across an entire year", factor: 365, diff: 2 as const },
  ];

  for (const ent of techEntities) {
    for (const inter of intervals) {
      const raw = ent.userCount * ent.dailyPerUser * inter.factor;
      const ans = Number(raw.toPrecision(2));
      generated.push({
        id: currentId++,
        question: `How many ${ent.metric} occur on ${ent.name} ${inter.label}?`,
        answer: ans,
        unit: ent.metric.split(" ")[0],
        explanation: `${ent.name} active users ≈ ${(ent.userCount / 1e6).toFixed(0)}M. Avg per user ≈ ${ent.dailyPerUser}/day. Multiplied by ${inter.factor} days -> ${ans.toLocaleString()}.`,
        category: ent.cat,
        difficulty: inter.diff,
      });
    }
  }

  // --- SUB-GENERATOR B: Physical Packaging & Dimensional Scaling (Difficulty 2 & 3) ---
  const containerList = [
    { name: "a standard Olympic pool", vol: 2500 },
    { name: "a 40-foot shipping container", vol: 77 },
    { name: "a Boeing 747 interior", vol: 1000 },
    { name: "an NBA basketball arena", vol: 400000 },
    { name: "the Great Pyramid of Giza", vol: 2600000 },
    { name: "a suburban two-car garage", vol: 90 },
    { name: "a standard yellow school bus", vol: 50 },
    { name: "a residential bathtub", vol: 0.3 },
    { name: "the Empire State Building", vol: 1040000 },
    { name: "a typical microwave oven", vol: 0.03 },
    { name: "the International Space Station", vol: 915 },
    { name: "a standard coffin", vol: 0.8 },
    { name: "a Tesla Model 3 interior", vol: 3 },
    { name: "a standard gym locker", vol: 0.2 },
    { name: "a semi-truck trailer", vol: 110 },
    { name: "a college dorm room", vol: 40 },
    { name: "a standard kitchen refrigerator", vol: 0.6 },
    { name: "the US Capitol Rotunda", vol: 35000 },
    { name: "a large Amazon delivery box", vol: 0.1 },
    { name: "a standard JanSport backpack", vol: 0.03 },
  ];

  const packingItems = [
    { vol: 3.35e-5, unit: "ping-pong balls" },
    { vol: 1.85e-4, unit: "Rubik's cubes" },
    { vol: 5.6e-3, unit: "soccer balls" },
    { vol: 3.5e-4, unit: "iPhone boxes" },
    { vol: 3.8e-4, unit: "soda cans" },
    { vol: 1e-9, unit: "grains of sand" },
    { vol: 6.3e-7, unit: "M&Ms" },
    { vol: 4.1e-5, unit: "golf balls" },
    { vol: 1.5e-4, unit: "tennis balls" },
    { vol: 7.1e-3, unit: "basketballs" },
    { vol: 5.0e-3, unit: "watermelons" },
    { vol: 1.9e-3, unit: "bricks" },
    { vol: 8.3e-6, unit: "AA batteries" },
    { vol: 1.2e-3, unit: "books" },
    { vol: 8.1e-7, unit: "quarters" },
    { vol: 2.0e-8, unit: "grains of rice" },
    { vol: 2.5e-2, unit: "pillows" },
    { vol: 3.4e-6, unit: "dice" },
    { vol: 2.1e-4, unit: "baseballs" },
    { vol: 7.0e-6, unit: "marshmallows" },
  ];

  for (const c of containerList) {
    for (const item of packingItems) {
      // Granular, non-spherical fill (sand, rice) settles looser than the
      // ~64% random-close-packing limit for spheres.
      const packingEfficiency = /sand|rice/.test(item.unit) ? 0.6 : 0.64;
      const raw = (c.vol * packingEfficiency) / item.vol;
      const ans = Number(raw.toPrecision(2));
      generated.push({
        id: currentId++,
        question: `How many ${item.unit} can fit inside ${c.name}?`,
        answer: ans,
        unit: item.unit,
        explanation: `Container volume = ${c.vol.toLocaleString()} m³. Item volume ≈ ${item.vol} m³. Random packing efficiency ≈ ${packingEfficiency * 100}%. (${c.vol} * ${packingEfficiency}) / ${item.vol} ≈ ${ans.toExponential(2)}.`,
        category: "engineering",
        difficulty: c.vol > 10000 ? 3 : c.vol < 1 ? 1 : 2,
      });
    }
  }

  // --- SUB-GENERATOR C: Urban & Per Capita Consumption (Difficulty 1 & 2) ---
  const metroRegions = [
    { city: "Tokyo Metro", pop: 37e6 },
    { city: "London", pop: 9e6 },
    { city: "New York City", pop: 8.5e6 },
    { city: "Paris", pop: 2.1e6 },
    { city: "Los Angeles County", pop: 9.8e6 },
    { city: "Singapore", pop: 5.9e6 },
    { city: "Sydney", pop: 5.3e6 },
    { city: "Toronto", pop: 3.0e6 },
  ];

  // `verb` keeps the question grammatical for both discrete events ("trips
  // are taken") and continuous quantities ("liters are consumed") — the
  // label itself stays a bare noun phrase so it doesn't double up with the
  // template's own verb.
  const cityActivities = [
    { label: "liters of municipal tap water", verb: "consumed", rate: 300, unit: "liters", cat: "engineering" as const },
    { label: "public transit trips", verb: "taken", rate: 1.4, unit: "trips", cat: "economics" as const },
    { label: "cups of coffee", verb: "bought at cafes", rate: 0.65, unit: "cups", cat: "everyday" as const },
    { label: "kilograms of solid trash", verb: "generated", rate: 1.8, unit: "kg", cat: "geography" as const },
    { label: "restaurant meals", verb: "ordered", rate: 0.45, unit: "meals", cat: "everyday" as const },
    { label: "kilowatt-hours (kWh) of residential electricity", verb: "used", rate: 12.0, unit: "kWh", cat: "physics" as const },
  ];

  for (const m of metroRegions) {
    for (const act of cityActivities) {
      const raw = m.pop * act.rate;
      const ans = Number(raw.toPrecision(2));
      generated.push({
        id: currentId++,
        question: `How many ${act.label} are ${act.verb} daily in ${m.city}?`,
        answer: ans,
        unit: act.unit,
        explanation: `${m.city} population ≈ ${(m.pop / 1e6).toFixed(1)}M. Avg rate ≈ ${act.rate} ${act.unit}/person/day. ${(m.pop / 1e6).toFixed(1)}M * ${act.rate} ≈ ${ans.toLocaleString()}.`,
        category: act.cat,
        difficulty: 1,
      });
    }
  }

  // --- SUB-GENERATOR D: Wealth Stacking & Financial Scale (Difficulty 2 & 3) ---
  const publicFigures = [
    { name: "Aliko Dangote ($13.4B)", netWorth: 13.4e9 },
    { name: "Robert F. Smith ($8B)", netWorth: 8e9 },
    { name: "David Steward ($7.6B)", netWorth: 7.6e9 },
    { name: "Michael Jordan ($3.2B)", netWorth: 3.2e9 },
    { name: "Oprah Winfrey ($2.8B)", netWorth: 2.8e9 },
    { name: "Jay-Z ($2.5B)", netWorth: 2.5e9 },
    { name: "Rihanna ($1.4B)", netWorth: 1.4e9 },
    { name: "Tyler Perry ($1.4B)", netWorth: 1.4e9 },
    { name: "Tiger Woods ($1.3B)", netWorth: 1.3e9 },
    { name: "LeBron James ($1.2B)", netWorth: 1.2e9 },
  ];

  const stackConversions = [
    {
      unit: "kilometers",
      calc: (nw: number) => ((nw / 100) * 1e-4) / 1000,
      denom: "$100 bills",
      desc: "A $100 bill is 0.1 mm (1e-4 m) thick. Height = (NetWorth / 100) * 1e-4 / 1000 km.",
    },
    {
      unit: "kilograms",
      calc: (nw: number) => (nw / 100) * 0.001,
      denom: "$100 bills",
      desc: "A US banknote weighs exactly 1 gram (0.001 kg). Weight = (NetWorth / 100) * 0.001 kg.",
    },
    {
      unit: "years",
      calc: (nw: number) => nw / (100 * 86400 * 365.25),
      denom: "$100/second spending",
      desc: "Spending $100 every single second ($8.64M/day). Time = NetWorth / ($100 * 31.5M sec/yr).",
    },
  ];

  for (const pf of publicFigures) {
    for (const sc of stackConversions) {
      const raw = sc.calc(pf.netWorth);
      const ans = Number(raw.toPrecision(2));
      generated.push({
        id: currentId++,
        question: `If you measured ${pf.name}'s net worth in ${sc.denom}, what is the equivalent in ${sc.unit}?`,
        answer: ans,
        unit: sc.unit,
        explanation: `${sc.desc} Result ≈ ${ans.toLocaleString()} ${sc.unit}.`,
        category: "pop-culture",
        difficulty: 2,
      });
    }
  }

  // --- SUB-GENERATOR E: Planetary & Biological Scale (Difficulty 1 & 2) ---
  const biologicalOrganisms = [
    { name: "Blue Whale", massKg: 150000, lifespanYrs: 85, hrBpm: 10 },
    { name: "African Elephant", massKg: 5000, lifespanYrs: 65, hrBpm: 30 },
    { name: "Grizzly Bear", massKg: 350, lifespanYrs: 25, hrBpm: 45 },
    { name: "Golden Retriever", massKg: 30, lifespanYrs: 12, hrBpm: 100 },
    { name: "House Mouse", massKg: 0.02, lifespanYrs: 2, hrBpm: 550 },
    { name: "Hummingbird", massKg: 0.004, lifespanYrs: 4, hrBpm: 1200 },
  ];

  for (const org of biologicalOrganisms) {
    // Lifetime heartbeats
    const lifetimeBeats = Number((org.hrBpm * 525600 * org.lifespanYrs).toPrecision(2));
    generated.push({
      id: currentId++,
      question: `How many lifetime heartbeats does an average ${org.name} have?`,
      answer: lifetimeBeats,
      unit: "beats",
      explanation: `Heart rate = ${org.hrBpm} bpm. Lifespan = ${org.lifespanYrs} years. Minutes in year = 525,600. ${org.hrBpm} * 525,600 * ${org.lifespanYrs} ≈ ${lifetimeBeats.toExponential(2)}. Note: most mammals average ~1 billion lifetime beats.`,
      category: "biology",
      difficulty: 1,
    });

    // Total cellular count estimation
    // Average cell mass ≈ 1e-12 kg (1 nanogram)
    const totalCells = Number((org.massKg / 1e-12).toPrecision(2));
    generated.push({
      id: currentId++,
      question: `Approximately how many biological cells comprise a full-grown ${org.name}?`,
      answer: totalCells,
      unit: "cells",
      explanation: `Mass = ${org.massKg} kg. Average eukaryotic cell mass ≈ 1 nanogram (1e-12 kg). Mass / 1e-12 kg ≈ ${totalCells.toExponential(2)} cells.`,
      category: "biology",
      difficulty: 2,
    });
  }

  return generated;
}

// ==========================================
// 3. MASTER EXPORT
// ==========================================

export const fermiQuestions: FermiQuestion[] = [...coreFermiQuestions, ...buildMatrixQuestions()];
