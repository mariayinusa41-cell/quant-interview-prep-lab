import type { TestCase } from "./runCode";

export type MiniLevel = "rookie" | "novice" | "intermediate" | "advanced";

export type MCQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export type CodingChallenge = {
  level: MiniLevel;
  title: string;
  prompt: string;
  functionName: string;
  starterCode: string;
  referenceSolution: string;
  testCases: TestCase[];
  preQuestions: MCQuestion[];
  postQuestions: MCQuestion[];
};
