"use client";

import { ConversationDetail } from "@/components/ConversationDetail";
import { ConversationList } from "@/components/ConversationList";
import { MetricsCards } from "@/components/MetricsCards";
import type { Metrics } from "@/lib/metrics/getMetrics";
import type { Conversation, Property } from "@/types";
import { useEffect, useMemo, useState } from "react";

type DashboardPayload = {
  conversations: Conversation[];
  metrics: Metrics;
  propertiesById: Record<string, Property>;
};

export function DashboardClient({ initialData }: { initialData: DashboardPayload }) {
  const [data, setData] = useState<DashboardPayload>(initialData);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  async function refresh() {
    const res = await fetch("/api/conversations");
    const payload = (await res.json()) as DashboardPayload;
    setData(payload);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const effectiveSelectedId = selectedId ?? data.conversations[0]?.id;
  const selectedConversation = useMemo(
    () => data?.conversations.find((c) => c.id === effectiveSelectedId) ?? null,
    [data, effectiveSelectedId],
  );
  const selectedProperty = selectedConversation?.propertyId
    ? (data?.propertiesById[selectedConversation.propertyId] ?? null)
    : null;

  return (
    <div className="space-y-4">
      <MetricsCards metrics={data.metrics} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <ConversationList
          conversations={data.conversations}
          selectedId={effectiveSelectedId}
          onSelect={setSelectedId}
        />
        <ConversationDetail
          conversation={selectedConversation}
          property={selectedProperty}
          onTakeControl={async (conversationId) => {
            await fetch(`/api/conversations/${conversationId}/take-control`, { method: "POST" });
            await refresh();
          }}
          onSendAgentMessage={async (conversationId, content) => {
            await fetch(`/api/conversations/${conversationId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }),
            });
            await refresh();
          }}
        />
      </div>
    </div>
  );
}
