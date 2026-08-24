import type { Segment } from "../antitrustMath";

export type MergingFirm = {
  id: string;
  name: string;
  revenue: number;
  merging: boolean;
};

export type CaseStudy = {
  id: string;
  tag: string;
  title: string;
  unit: string;
  premise: string;
  interviewNote: string;
  substituteThreshold: number;
  deltaTolerance: number;
  core: MergingFirm[];
  candidates: Segment[];
  correctExplanation: string;
  wrongExplanation: string;
  verdictNarrative: string;
};

// 1. Define the Real-World Landmark Cases
export const CASES: Record<string, CaseStudy> = {
  kroger: {
    id: "kroger",
    tag: "FTC v. Kroger / Albertsons",
    title: "The Supermarket Mega-Merger",
    unit: "$B",
    premise: "Kroger and Albertsons want to combine. The merging parties argue Walmart, Costco, and Amazon constrain them; the FTC argues for 'traditional supermarkets.'",
    interviewNote: "Focus on one-stop shopping: consumers do not view dollar stores or specialty grocers as full basket substitutes when prices tick up.",
    substituteThreshold: 1.0,
    deltaTolerance: 30,
    core: [
      { id: "kroger", name: "Kroger Co.", revenue: 148, merging: true },
      { id: "albertsons", name: "Albertsons Cos.", revenue: 78, merging: true },
      { id: "regional", name: "Regional Grocers (Ahold, Publix)", revenue: 110, merging: false },
    ],
    candidates: [
      { id: "supercenters", name: "Supercenters (Walmart/Target)", detail: "Full grocery footprint with comparable product breadth.", firms: [160, 50], crossElasticity: 1.25, belongs: true, why: "Empirical diversion ratios show immediate defection to Walmart upon local price hikes." },
      { id: "club", name: "Wholesale Clubs (Costco)", detail: "Membership required, bulk-packaging, limited SKU variety.", firms: [110, 65], crossElasticity: 0.45, belongs: false, why: "Club stores serve stock-up trips, not quick weekly basket substitutes." },
      { id: "dollar", name: "Dollar Stores (Dollar General)", detail: "Limited fresh produce, small store footprints.", firms: [45, 35, 25], crossElasticity: 0.35, belongs: false, why: "Lacks the full-basket breadth needed to replace a primary supermarket trip." },
    ],
    correctExplanation: "Market defined as Traditional Supermarkets + Supercenters. Club stores, discounters, and online grocers lack sufficient basket substitutability.",
    wrongExplanation: "Lumping in wholesale clubs and dollar stores artificially dilutes the market and ignores trip-mission economics.",
    verdictNarrative: "In local market overlaps, the FTC relied on the 2023 Merger Guidelines, projecting an HHI delta of 1,449. A strong presumption of anticompetitive harm.",
  },
  apple: {
    id: "apple",
    tag: "Epic Games v. Apple",
    title: "Two-Sided App Ecosystems",
    unit: "$B",
    premise: "Epic challenged Apple's 30% App Store commission. Apple argued the relevant market was 'all digital gaming platforms'; Epic argued for 'iOS in-app payment processing.'",
    interviewNote: "Two-sided market lock-in: once a consumer owns an iPhone, switching costs prevent other hardware from disciplining app store fees.",
    substituteThreshold: 1.0,
    deltaTolerance: 40,
    core: [
      { id: "ios_iap", name: "Apple App Store (iOS IAP)", revenue: 20, merging: true },
      { id: "google_play", name: "Google Play Store (Android)", revenue: 14, merging: false },
    ],
    candidates: [
      { id: "alt_mobile_iap", name: "Alternative In-App Payments", detail: "Direct payment gateways embedded within mobile apps.", firms: [3, 2], crossElasticity: 1.65, belongs: true, why: "Direct payment routing is a 1-to-1 substitute for developers facing Apple's fee." },
      { id: "consoles", name: "Gaming Consoles (PS5, Xbox)", detail: "Living-room hardware with high performance.", firms: [18, 12, 10], crossElasticity: 0.28, belongs: false, why: "Consoles are not pocketable. High hardware costs create asymmetric switching barriers." },
      { id: "pc_gaming", name: "PC Game Distribution (Steam)", detail: "Open desktop platforms with multiple storefronts.", firms: [12, 8], crossElasticity: 0.35, belongs: false, why: "Mobile players do not abandon iOS gaming over a 5% in-app price difference." },
    ],
    correctExplanation: "The court defined the relevant market as digital mobile gaming transactions. Dedicated consoles are non-substitutable ecosystems.",
    wrongExplanation: "Including PC and console stores ignores hardware lock-in and single-homing mobile consumer behavior.",
    verdictNarrative: "Apple holds a 52-57% share in mobile gaming transactions. While not deemed an antitrust monopoly, anti-steering rules violated California's Unfair Competition Law.",
  },
  beer: {
    id: "beer",
    tag: "DOJ v. AB InBev / Grupo Modelo",
    title: "The Mainstream Beer Duopoly",
    unit: "$B",
    premise: "AB InBev attempted to acquire Grupo Modelo (Corona). ABI argued that wine, spirits, and craft beers discipline lager prices.",
    interviewNote: "Price-following dynamics: ABI used Modelo's aggressive pricing as its benchmark; removing Modelo eliminated the primary price maverick.",
    substituteThreshold: 1.0,
    deltaTolerance: 25,
    core: [
      { id: "abi", name: "Anheuser-Busch InBev", revenue: 16, merging: true },
      { id: "modelo", name: "Grupo Modelo", revenue: 3, merging: true },
      { id: "millercoors", name: "MillerCoors", revenue: 10, merging: false },
    ],
    candidates: [
      { id: "imports", name: "Premium Imports (Constellation)", detail: "Mass-market import lagers.", firms: [2, 1], crossElasticity: 1.35, belongs: true, why: "Directly adjacent to Modelo on store shelves with symmetric price responsiveness." },
      { id: "craft", name: "Independent Craft Brewers", detail: "Localized distribution, higher ABV profiles.", firms: [3, 2, 1], crossElasticity: 0.4, belongs: false, why: "Craft beer sits at a significantly higher price band and does not constrain macro-lager pricing." },
      { id: "spirits", name: "Spirits & Hard Liquor", detail: "Distilled alcohol for cocktails.", firms: [8, 6, 5], crossElasticity: 0.15, belongs: false, why: "Different drinking occasion, alcohol content, and retail tax structure." },
    ],
    correctExplanation: "Market defined as Mass-Market & Import Lagers. Spirits and micro-craft beers do not constrain macro lager prices.",
    wrongExplanation: "Adding liquor and niche craft dilutes the duopoly's massive coordinated pricing power.",
    verdictNarrative: "Post-HHI exceeds 2900 with ΔHHI > 250. ABI was forced to divest Modelo's US rights to Constellation Brands.",
  },
  amex: {
    id: "amex",
    tag: "Ohio v. American Express",
    title: "Two-Sided Platform Rules",
    unit: "$B",
    premise: "The DOJ sued Amex over anti-steering rules preventing merchants from encouraging cheaper cards. Amex argued both sides of the platform must be evaluated jointly.",
    interviewNote: "Two-sided transaction platforms: network effects link cardholders and merchants. You cannot define the market on one side alone.",
    substituteThreshold: 1.0,
    deltaTolerance: 35,
    core: [
      { id: "amex", name: "American Express", revenue: 36, merging: true },
      { id: "discover", name: "Discover", revenue: 11, merging: true },
      { id: "visa", name: "Visa", revenue: 24, merging: false },
    ],
    candidates: [
      { id: "co_branded", name: "Store-Brand Private Label", detail: "Revolving credit cards usable across retail chains.", firms: [5, 4], crossElasticity: 1.15, belongs: true, why: "Competes directly for consumer wallet share and merchant transaction settlement." },
      { id: "debit", name: "Debit & PIN Networks", detail: "Immediate bank account debits without revolving credit.", firms: [8, 6, 4], crossElasticity: 0.45, belongs: false, why: "Debit cards do not offer credit extension or high rewards points." },
      { id: "cash", name: "ACH Transfers & Cash", detail: "Zero-fee paper currency and slow electronic settlement.", firms: [15, 10], crossElasticity: 0.1, belongs: false, why: "Cannot support rapid e-commerce or large unsecured consumer transactions." },
    ],
    correctExplanation: "Relevant market: General Purpose Credit and Charge Card Networks. Cash and debit do not discipline network merchant swipe fees.",
    wrongExplanation: "Including cash or pure debit dilutes network power and misses the core two-sided feedback loop.",
    verdictNarrative: "A hypothetical Amex/Discover merger creates a 46% network share with ΔHHI > 380, leading to severe regulatory challenge.",
  },
};

// 2. Procedural Generator for 35 Fictional Industry Variations
const INDUSTRY_TEMPLATES = [
  {
    category: "Coffee Shops",
    unit: "$M",
    premise: "Two premium café chains want to merge. You must determine if fast-food drive-thrus belong in the same market.",
    coreBase: [
      { id: "t1", name: "", revenue: 300, merging: true },
      { id: "t2", name: "", revenue: 220, merging: true },
      { id: "r1", name: "Major Rival", revenue: 180, merging: false },
      { id: "indies", name: "Independent Cafés", revenue: 300, merging: false }
    ],
    candidatesBase: [
      { id: "artisan", name: "Artisan Micro-Roasteries", detail: "Same sit-down occasion, comparable price.", firms: [45, 45, 40], crossElasticity: 1.4, belongs: true, why: "Customers move here readily when premium prices rise." },
      { id: "qsr", name: "Fast-Food Drive-Thru", detail: "Far cheaper, built for speed.", firms: [420, 400], crossElasticity: 0.3, belongs: false, why: "A 5% rise in café prices barely moves these customers." },
      { id: "home", name: "Home Espresso Machines", detail: "Durable good, not a daily cup.", firms: [160, 150], crossElasticity: 0.15, belongs: false, why: "One-off appliance purchases do not discipline per-cup pricing." }
    ],
    explainRight: "Market correctly defined: Core cafés plus artisan roasteries.",
    explainWrong: "Including drive-thrus or home machines dilutes the market and ignores the true consumer occasion.",
    pairs: [
      { names: ["Rooke Coffee", "Bellweather Roasters"], mult: 1.0 },
      { names: ["Morning Brew", "WakeCup"], mult: 1.4 },
      { names: ["Bean & Leaf", "Urban Roasters"], mult: 0.8 },
      { names: ["Ascent Coffee", "Summit Beans"], mult: 2.1 },
      { names: ["Metro Grind", "City Sip"], mult: 1.15 }
    ]
  },
  {
    category: "Athletic Footwear",
    unit: "$M",
    premise: "Two major performance running shoe brands intend to merge. Do formal dress shoes constrain their pricing?",
    coreBase: [
      { id: "t1", name: "", revenue: 450, merging: true },
      { id: "t2", name: "", revenue: 320, merging: true },
      { id: "r1", name: "Global Rival", revenue: 500, merging: false },
      { id: "indies", name: "Niche Runners", revenue: 150, merging: false }
    ],
    candidatesBase: [
      { id: "athleisure", name: "Athleisure Sneakers", detail: "Casual athletic wear, highly substitutable for light running.", firms: [200, 150], crossElasticity: 1.3, belongs: true, why: "Consumers easily swap performance runners for lifestyle sneakers for casual use." },
      { id: "dress", name: "Formal Dress Shoes", detail: "Leather, non-athletic soles.", firms: [300, 250], crossElasticity: 0.1, belongs: false, why: "Zero utility crossover. You don't buy loafers to run a marathon." },
      { id: "hiking", name: "Heavy Hiking Boots", detail: "Specialized rugged terrain gear.", firms: [180, 120], crossElasticity: 0.4, belongs: false, why: "Too specialized and heavy to constrain daily running shoe prices." }
    ],
    explainRight: "Market includes performance runners and athleisure sneakers. Dress shoes are functionally distinct.",
    explainWrong: "Including dress shoes or heavy boots fails the SSNIP test; runners won't switch to them if prices rise 5%.",
    pairs: [
      { names: ["Stride Dynamics", "Pace Athletics"], mult: 1.0 },
      { names: ["Velocity Shoes", "Apex Runners"], mult: 1.5 },
      { names: ["Tread Co.", "Sole Mates"], mult: 0.9 },
      { names: ["Dash Footwear", "Sprint Line"], mult: 2.0 },
      { names: ["AeroKicks", "CloudStep"], mult: 1.2 }
    ]
  },
  {
    category: "Fast Food QSR",
    unit: "$B",
    premise: "Two national burger chains are merging. Does sit-down dining belong in the same antitrust market?",
    coreBase: [
      { id: "t1", name: "", revenue: 12, merging: true },
      { id: "t2", name: "", revenue: 8, merging: true },
      { id: "r1", name: "Market Leader", revenue: 20, merging: false },
    ],
    candidatesBase: [
      { id: "fastcasual", name: "Fast-Casual Dining", detail: "No drive-thru, but rapid counter service.", firms: [5, 4, 3], crossElasticity: 1.2, belongs: true, why: "Price points and convenience overlap heavily with premium fast food." },
      { id: "sitdown", name: "Sit-Down Casual", detail: "Table service, tipping expected, 45+ minute dining time.", firms: [15, 12], crossElasticity: 0.3, belongs: false, why: "Different occasion. Consumers wanting a 5-minute drive-thru meal won't switch to a 45-minute sit-down dinner." },
      { id: "grocery", name: "Grocery Prepared Meals", detail: "Deli counters and rotisserie chickens.", firms: [10, 8], crossElasticity: 0.5, belongs: false, why: "Requires a supermarket trip, generally lacking immediate hot-consumption convenience." }
    ],
    explainRight: "The market is QSRs and Fast-Casual. Convenience and speed define the cross-elasticity.",
    explainWrong: "Sit-down restaurants and grocery delis serve entirely different time-constraints and dining occasions.",
    pairs: [
      { names: ["BurgerBros", "FryNation"], mult: 1.0 },
      { names: ["GrillMaster", "PattyShack"], mult: 1.3 },
      { names: ["QuickBite", "FastBurger"], mult: 0.7 },
      { names: ["StarGrill", "MeteorMeals"], mult: 1.8 },
      { names: ["DriveThru Kings", "Burger Dash"], mult: 1.1 }
    ]
  },
  {
    category: "Airlines",
    unit: "$B",
    premise: "Two legacy airline carriers are merging their hub networks. Do high-speed trains constrain their domestic pricing?",
    coreBase: [
      { id: "t1", name: "", revenue: 25, merging: true },
      { id: "t2", name: "", revenue: 15, merging: true },
      { id: "r1", name: "Rival Legacy Carrier", revenue: 30, merging: false },
    ],
    candidatesBase: [
      { id: "lcc", name: "Low-Cost Carriers (LCC)", detail: "No-frills flying on identical routes.", firms: [10, 8, 5], crossElasticity: 1.6, belongs: true, why: "Direct route overlap; leisure travelers highly sensitive to legacy price hikes." },
      { id: "regional", name: "Regional Puddle-Jumpers", detail: "Short-haul turboprops to minor airports.", firms: [4, 3], crossElasticity: 0.4, belongs: false, why: "Do not compete on major hub-to-hub transcontinental routes." },
      { id: "hsr", name: "High-Speed Rail", detail: "Fast trains, but geographically limited.", firms: [5, 4], crossElasticity: 0.2, belongs: false, why: "Rail cannot substitute a 4-hour cross-country flight." }
    ],
    explainRight: "Market includes Legacy and Low-Cost Carriers on overlapping routes.",
    explainWrong: "Trains and regional short-haul do not constrain pricing on major national flight corridors.",
    pairs: [
      { names: ["SkyLink", "AeroConnect"], mult: 1.0 },
      { names: ["Horizon Air", "Altitude"], mult: 1.4 },
      { names: ["Oceanic Flights", "Continental Jet"], mult: 0.8 },
      { names: ["Apex Airways", "Pinnacle Air"], mult: 2.2 },
      { names: ["Voyageur", "TransSky"], mult: 1.2 }
    ]
  },
  {
    category: "Electric Vehicles",
    unit: "$B",
    premise: "Two mass-market EV manufacturers are combining. Do traditional gas-guzzling trucks constrain EV sedan prices?",
    coreBase: [
      { id: "t1", name: "", revenue: 40, merging: true },
      { id: "t2", name: "", revenue: 25, merging: true },
      { id: "r1", name: "Global Competitor", revenue: 60, merging: false },
    ],
    candidatesBase: [
      { id: "phev", name: "Plug-in Hybrids (PHEV)", detail: "Battery + Gas engine, similar eco-conscious buyer profile.", firms: [20, 15], crossElasticity: 1.4, belongs: true, why: "High cross-elasticity. EV buyers readily cross-shop PHEVs if pure EV prices spike." },
      { id: "ice_trucks", name: "Heavy ICE Trucks", detail: "Gas/Diesel heavy-duty commercial towing.", firms: [50, 40], crossElasticity: 0.1, belongs: false, why: "An EV commuter is not substituting a heavy-duty diesel truck." },
      { id: "ebikes", name: "E-Bikes & Scooters", detail: "Micro-mobility for urban last-mile.", firms: [5, 3], crossElasticity: 0.2, belongs: false, why: "Cannot substitute highway driving or family transport." }
    ],
    explainRight: "EVs and Plug-in Hybrids form a cohesive eco-vehicle market.",
    explainWrong: "Heavy trucks and micro-mobility serve entirely distinct utility profiles.",
    pairs: [
      { names: ["VoltMotors", "Electra"], mult: 1.0 },
      { names: ["Ampere Auto", "ChargeTech"], mult: 1.5 },
      { names: ["NeoDrive", "EvoCars"], mult: 0.85 },
      { names: ["Pulse Vehicles", "Spark Motors"], mult: 2.1 },
      { names: ["EcoRide", "Current Auto"], mult: 1.15 }
    ]
  },
  {
    category: "Cloud Tech",
    unit: "$B",
    premise: "Two enterprise cloud infrastructure (IaaS) providers are merging. Does consumer photo storage count as a competitor?",
    coreBase: [
      { id: "t1", name: "", revenue: 15, merging: true },
      { id: "t2", name: "", revenue: 10, merging: true },
      { id: "r1", name: "Hyperscaler Leader", revenue: 45, merging: false },
    ],
    candidatesBase: [
      { id: "paas", name: "Platform-as-a-Service (PaaS)", detail: "Managed cloud environments for enterprise devs.", firms: [8, 6, 4], crossElasticity: 1.2, belongs: true, why: "Enterprise clients frequently substitute raw IaaS for managed PaaS based on pricing." },
      { id: "onprem", name: "On-Premise Hardware", detail: "Physical servers in corporate basements.", firms: [12, 10], crossElasticity: 0.4, belongs: false, why: "High capital expenditure and lead times prevent rapid substitution to physical servers." },
      { id: "consumer", name: "Consumer Cloud Storage", detail: "Personal photo and file backup.", firms: [5, 4], crossElasticity: 0.05, belongs: false, why: "Enterprise computing workloads cannot be run on a personal Google Drive." }
    ],
    explainRight: "Enterprise IaaS and PaaS are direct substitutes for corporate workloads.",
    explainWrong: "On-premise hardware has too much friction, and consumer storage lacks compute capability.",
    pairs: [
      { names: ["CloudNet", "DataHost"], mult: 1.0 },
      { names: ["ServerSky", "InfraTech"], mult: 1.6 },
      { names: ["GridCompute", "NodeHost"], mult: 0.75 },
      { names: ["ApexCloud", "ZenithServers"], mult: 2.4 },
      { names: ["Nimbus IT", "Stratus Data"], mult: 1.25 }
    ]
  },
  {
    category: "Retail Banking",
    unit: "$B",
    premise: "Two regional commercial banks want to merge. Do investment banks constrain their checking account fees?",
    coreBase: [
      { id: "t1", name: "", revenue: 8, merging: true },
      { id: "t2", name: "", revenue: 6, merging: true },
      { id: "r1", name: "National Megabank", revenue: 25, merging: false },
    ],
    candidatesBase: [
      { id: "creditunions", name: "Regional Credit Unions", detail: "Member-owned institutions offering identical retail checking.", firms: [3, 2, 2], crossElasticity: 1.5, belongs: true, why: "Consumers actively switch to credit unions when retail bank fees increase." },
      { id: "investment", name: "Investment Banks", detail: "M&A advisory and institutional trading.", firms: [15, 12], crossElasticity: 0.1, belongs: false, why: "Investment banks do not offer retail checking accounts." },
      { id: "crypto", name: "Crypto Exchanges", detail: "Digital asset trading platforms.", firms: [4, 3], crossElasticity: 0.3, belongs: false, why: "Lacks FDIC insurance and standard payroll direct-deposit utility." }
    ],
    explainRight: "Retail banks and credit unions compete directly for consumer deposits.",
    explainWrong: "Investment banks and crypto platforms do not provide standard consumer retail banking services.",
    pairs: [
      { names: ["Vault Bank", "SafeCapital"], mult: 1.0 },
      { names: ["First National", "TrustFinance"], mult: 1.3 },
      { names: ["Apex Bank", "Merit Financial"], mult: 0.8 },
      { names: ["Pinnacle Trust", "Summit Bank"], mult: 2.0 },
      { names: ["Crest Capital", "Horizon Bank"], mult: 1.1 }
    ]
  }
];

// Generator execution: loop through templates and permutations
INDUSTRY_TEMPLATES.forEach((tpl, tplIndex) => {
  tpl.pairs.forEach((pair, pairIndex) => {
    const id = `fictional_${tplIndex}_${pairIndex}`;
    
    // Scale all revenues based on the permutation multiplier so math varies per case
    const scaledCore = tpl.coreBase.map((firm, i) => ({
      ...firm,
      name: i < 2 ? pair.names[i] : firm.name,
      revenue: Math.round(firm.revenue * pair.mult)
    }));

    const scaledCandidates = tpl.candidatesBase.map(cand => ({
      ...cand,
      firms: cand.firms.map(f => Math.round(f * pair.mult))
    }));

    CASES[id] = {
      id,
      tag: `${tpl.category} (${pair.names[0]} & ${pair.names[1]})`,
      title: `The ${tpl.category} Consolidation`,
      unit: tpl.unit,
      premise: tpl.premise,
      interviewNote: "Market definition dictates the math. Always establish cross-elasticity before running HHI.",
      substituteThreshold: 1.0,
      deltaTolerance: 25,
      core: scaledCore,
      candidates: scaledCandidates,
      correctExplanation: tpl.explainRight,
      wrongExplanation: tpl.explainWrong,
      verdictNarrative: "The mathematical threshold test applies to the correctly bounded market."
    };
  });
});

