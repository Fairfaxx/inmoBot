import type { Conversation } from "@/types";

export type ConversionMetrics = {
  totalLeads: number;
  botActive: number;
  needsHuman: number;
  humanActive: number;
  closed: number;
  lost: number;
  conversionRate: number;
  closeVsLostRate: number;
};

export function getConversionMetrics(
  conversations: Conversation[],
  agentId?: string,
): ConversionMetrics {
  const filtered = agentId
    ? conversations.filter((conversation) => conversation.assignedAgentId === agentId)
    : conversations;

  const totalLeads = filtered.length;
  const botActive = filtered.filter((c) => c.status === "bot_active").length;
  const needsHuman = filtered.filter((c) => c.status === "needs_human").length;
  const humanActive = filtered.filter((c) => c.status === "human_active").length;
  const closed = filtered.filter((c) => c.status === "closed").length;
  const lost = filtered.filter((c) => c.status === "lost").length;
  const conversionRate = totalLeads ? (closed / totalLeads) * 100 : 0;
  const closeVsLostRate = closed + lost ? (closed / (closed + lost)) * 100 : 0;

  return {
    totalLeads,
    botActive,
    needsHuman,
    humanActive,
    closed,
    lost,
    conversionRate,
    closeVsLostRate,
  };
}
