import type { ConversationStatus, MessageSender } from "../../src/types";

export type CaseHistoryMessage = {
  sender: MessageSender;
  content: string;
};

export type Assertion =
  | { type: "status"; equals: ConversationStatus }
  | { type: "contains"; text: string }
  | { type: "containsAny"; texts: string[] }
  | { type: "notContains"; text: string }
  | { type: "judge"; rubric: string; mustPass: string[] };

export type EvalCase = {
  id: string;
  flow: string;
  description: string;
  propertyCode?: string;
  history?: CaseHistoryMessage[];
  userMessage: string;
  assertions: Assertion[];
};

export type CaseResult = {
  case: EvalCase;
  reply: { content: string; status: ConversationStatus };
  assertionResults: AssertionResult[];
  passed: boolean;
  durationMs: number;
};

export type AssertionResult = {
  assertion: Assertion;
  passed: boolean;
  reason: string;
};

export type RunSummary = {
  results: CaseResult[];
  totalCases: number;
  passedCases: number;
  failedCases: number;
  durationMs: number;
  approxCostUsd: number;
};
