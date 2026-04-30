import type { Conversation } from "@/types";

export type Metrics = {
  totalLeads: number;
  activeLeads: number;
  needsHuman: number;
  closed: number;
  lost: number;
};

export function getMetrics(conversations: Conversation[]): Metrics {
  return conversations.reduce<Metrics>(
    (acc, conversation) => {
      acc.totalLeads += 1;
      if (
        conversation.status === "new" ||
        conversation.status === "bot_active" ||
        conversation.status === "human_active"
      ) {
        acc.activeLeads += 1;
      }
      if (conversation.status === "needs_human") acc.needsHuman += 1;
      if (conversation.status === "closed") acc.closed += 1;
      if (conversation.status === "lost") acc.lost += 1;
      return acc;
    },
    { totalLeads: 0, activeLeads: 0, needsHuman: 0, closed: 0, lost: 0 },
  );
}
