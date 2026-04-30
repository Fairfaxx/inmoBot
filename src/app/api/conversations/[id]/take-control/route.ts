import { conversationStore } from "@/lib/conversations/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, ctx: Params): Promise<Response> {
  const { id } = await ctx.params;
  const updated = conversationStore.update(id, {
    status: "human_active",
    assignedAgentId: "agent-001",
  });
  if (!updated) {
    return Response.json({ error: "conversation not found" }, { status: 404 });
  }
  return Response.json({ conversation: updated });
}
