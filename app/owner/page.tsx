import Link from "next/link";
import { OwnerAnalyticsClient } from "@/components/OwnerAnalyticsClient";
import { conversationStore } from "@/lib/conversations/store";
import { getConversionMetrics } from "@/lib/metrics/conversion";

const AGENT_NAMES: Record<string, string> = {
  "agent-001": "Vendedora Ana",
  "agent-002": "Vendedor Bruno",
  "agent-003": "Vendedora Carla",
};

export default function OwnerPage() {
  const conversations = conversationStore.list();
  const dynamicAgentIds = Array.from(
    new Set(conversations.map((c) => c.assignedAgentId).filter(Boolean)),
  ) as string[];
  const agentIds = Array.from(new Set([...Object.keys(AGENT_NAMES), ...dynamicAgentIds]));

  const initialData = {
    global: getConversionMetrics(conversations),
    byAgent: agentIds.map((agentId) => ({
      agentId,
      agentName: AGENT_NAMES[agentId] || agentId,
      metrics: getConversionMetrics(conversations, agentId),
    })),
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Analytics del dueño</h1>
        <Link href="/dashboard" className="text-sm font-medium text-blue-700 hover:text-blue-900">
          Volver a dashboard
        </Link>
      </div>
      <OwnerAnalyticsClient initialData={initialData} />
    </main>
  );
}
