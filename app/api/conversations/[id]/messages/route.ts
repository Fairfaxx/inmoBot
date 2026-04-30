import { conversationStore } from "@/lib/conversations/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params): Promise<Response> {
  const { id } = await ctx.params;
  const body = (await req.json()) as { content?: string };
  if (!body.content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const message = conversationStore.addMessage({
    conversationId: id,
    sender: "agent",
    content: body.content,
  });
  if (!message) {
    return Response.json({ error: "conversation not found" }, { status: 404 });
  }
  conversationStore.setStatus(id, "human_active");
  const conversation = conversationStore.getById(id)!;
  return Response.json({ conversation, message });
}
