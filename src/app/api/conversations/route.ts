import { mockProperties } from "@/data/mock-properties";
import { conversationStore } from "@/lib/conversations/store";
import { getMetrics } from "@/lib/metrics/getMetrics";

export async function GET(): Promise<Response> {
  const conversations = conversationStore.list();
  const metrics = getMetrics(conversations);
  const propertiesById = Object.fromEntries(mockProperties.map((p) => [p.id, p]));
  return Response.json({
    conversations,
    metrics,
    propertiesById,
  });
}
