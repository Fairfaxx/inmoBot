import { conversationStore } from "@/lib/conversations/store";
import { getConversionMetrics } from "@/lib/metrics/conversion";

const AGENT_NAMES: Record<string, string> = {
  "agent-001": "Vendedora Ana",
  "agent-002": "Vendedor Bruno",
  "agent-003": "Vendedora Carla",
};

export async function GET(): Promise<Response> {
  const conversations = conversationStore.list();
  const global = getConversionMetrics(conversations);
  const dynamicAgentIds = Array.from(
    new Set(conversations.map((c) => c.assignedAgentId).filter(Boolean)),
  ) as string[];
  const agentIds = Array.from(new Set([...Object.keys(AGENT_NAMES), ...dynamicAgentIds]));

  const byAgent = agentIds.map((agentId) => ({
    agentId,
    agentName: AGENT_NAMES[agentId] || agentId,
    metrics: getConversionMetrics(conversations, agentId),
  }));

  return Response.json({
    global,
    byAgent,
  });
}
