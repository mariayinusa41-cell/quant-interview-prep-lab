import type { Assessment } from "../engine/types";
import { OPTIVER_TRADING } from "./optiver";
import { RESEARCH_ASSESSMENT } from "./research";
import { QUANTDEV_ASSESSMENT } from "./quantdev";
import { RISK_ASSESSMENT } from "./risk";
import { ECON_ASSESSMENT } from "./econ";
import { ACTUARIAL_ASSESSMENT } from "./actuarial";

/** One assessment per track, each modelled on a real published format. */
export const ASSESSMENTS: Assessment[] = [
  OPTIVER_TRADING,
  RESEARCH_ASSESSMENT,
  QUANTDEV_ASSESSMENT,
  RISK_ASSESSMENT,
  ECON_ASSESSMENT,
  ACTUARIAL_ASSESSMENT,
];

export const ASSESSMENT_BY_ID = ASSESSMENTS.reduce(
  (acc, a) => { acc[a.id] = a; return acc; },
  {} as Record<string, Assessment>,
);
