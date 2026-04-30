import { generateReply } from "@/lib/ai/generateReply";
import { conversationStore } from "@/lib/conversations/store";
import { getPropertyContext, resolvePropertyFromMessage } from "@/lib/properties/property-resolver";
import type { ChatRequest, ChatResponse } from "@/types";

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as ChatRequest;
  if (!body.content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const conversation =
    (body.conversationId && conversationStore.getById(body.conversationId)) ||
    conversationStore.create({
      leadName: body.leadName,
      leadPhone: body.leadPhone,
      propertyId: body.propertyId,
    });

  const leadMessage = conversationStore.addMessage({
    conversationId: conversation.id,
    sender: "lead",
    content: body.content,
  });
  if (!leadMessage) {
    return Response.json({ error: "conversation not found" }, { status: 404 });
  }

  const existingProperty = await getPropertyContext(conversation.propertyId || body.propertyId);
  const resolution = existingProperty
    ? { property: existingProperty, options: [], reason: "exact" as const }
    : await resolvePropertyFromMessage(body.content);
  const property = resolution.property;

  if (property && !conversation.propertyId) {
    conversationStore.update(conversation.id, { propertyId: property.id });
  }

  const reply = await generateReply({
    conversation: conversationStore.getById(conversation.id)!,
    message: body.content,
    property,
    propertyOptions: resolution.options,
    matchedByMessage: resolution.reason === "exact" && Boolean(property),
  });

  conversationStore.setStatus(conversation.id, reply.status);
  const botMessage = conversationStore.addMessage({
    conversationId: conversation.id,
    sender: "bot",
    content: reply.content,
  });
  if (!botMessage) {
    return Response.json({ error: "failed to save bot reply" }, { status: 500 });
  }

  const updated = conversationStore.getById(conversation.id)!;
  const payload: ChatResponse = { conversation: updated, botMessage };
  return Response.json(payload);
}
