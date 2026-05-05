import { generateReply } from "../../src/lib/ai/generateReply";
import { mockProperties } from "../../src/data/mock-properties";
import type { Conversation, Message, Property } from "../../src/types";
import { judge, type JudgeVerdict } from "./judge";
import type {
  Assertion,
  AssertionResult,
  CaseResult,
  EvalCase,
} from "./types";

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

function buildConversation(testCase: EvalCase): Conversation {
  const now = new Date().toISOString();
  const messages: Message[] = (testCase.history ?? []).map((m) => ({
    id: nextMessageId(),
    conversationId: "conv-eval",
    sender: m.sender,
    content: m.content,
    createdAt: now,
  }));

  return {
    id: "conv-eval",
    clientId: "lead-eval",
    leadName: "Lead Eval",
    leadPhone: "+5491100000000",
    propertyId: undefined,
    status: "bot_active",
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

function findProperty(code?: string): Property | null {
  if (!code) return null;
  return mockProperties.find((p) => p.code === code) ?? null;
}

export type RunOutcome = {
  results: CaseResult[];
  judgeInputTokens: number;
  judgeOutputTokens: number;
};

export async function runCases(cases: EvalCase[]): Promise<RunOutcome> {
  const results: CaseResult[] = [];
  let judgeInputTokens = 0;
  let judgeOutputTokens = 0;

  for (const testCase of cases) {
    const start = Date.now();
    const conversation = buildConversation(testCase);
    const property = findProperty(testCase.propertyCode);

    let reply: { content: string; status: Conversation["status"] };
    try {
      reply = await generateReply({
        conversation,
        message: testCase.userMessage,
        property,
        propertyOptions: [],
        matchedByMessage: Boolean(property),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reply = { content: `__error__: ${errorMessage}`, status: "bot_active" };
    }

    const assertionResults: AssertionResult[] = [];
    for (const assertion of testCase.assertions) {
      const result = await runAssertion({
        assertion,
        testCase,
        reply,
      });
      assertionResults.push(result.result);
      judgeInputTokens += result.inputTokens;
      judgeOutputTokens += result.outputTokens;
    }

    const passed = assertionResults.every((r) => r.passed);
    results.push({
      case: testCase,
      reply,
      assertionResults,
      passed,
      durationMs: Date.now() - start,
    });
  }

  return { results, judgeInputTokens, judgeOutputTokens };
}

async function runAssertion(input: {
  assertion: Assertion;
  testCase: EvalCase;
  reply: { content: string; status: Conversation["status"] };
}): Promise<{ result: AssertionResult; inputTokens: number; outputTokens: number }> {
  const { assertion, testCase, reply } = input;
  const lower = reply.content.toLowerCase();

  if (assertion.type === "status") {
    const passed = reply.status === assertion.equals;
    return {
      result: {
        assertion,
        passed,
        reason: passed
          ? `status="${reply.status}"`
          : `esperado status="${assertion.equals}", recibido "${reply.status}"`,
      },
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  if (assertion.type === "contains") {
    const passed = lower.includes(assertion.text.toLowerCase());
    return {
      result: {
        assertion,
        passed,
        reason: passed
          ? `contiene "${assertion.text}"`
          : `no contiene "${assertion.text}"`,
      },
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  if (assertion.type === "containsAny") {
    const found = assertion.texts.find((t) => lower.includes(t.toLowerCase()));
    return {
      result: {
        assertion,
        passed: Boolean(found),
        reason: found
          ? `contiene "${found}"`
          : `no contiene ninguno de [${assertion.texts.join(", ")}]`,
      },
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  if (assertion.type === "notContains") {
    const passed = !lower.includes(assertion.text.toLowerCase());
    return {
      result: {
        assertion,
        passed,
        reason: passed
          ? `no contiene "${assertion.text}"`
          : `contiene texto prohibido "${assertion.text}"`,
      },
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  // judge
  const verdict: JudgeVerdict = await judge({
    caseDescription: testCase.description,
    userMessage: testCase.userMessage,
    botReply: reply.content,
    rubric: assertion.rubric,
    mustPass: assertion.mustPass,
  });
  return {
    result: {
      assertion,
      passed: verdict.pass,
      reason: verdict.reason,
    },
    inputTokens: verdict.inputTokens,
    outputTokens: verdict.outputTokens,
  };
}
