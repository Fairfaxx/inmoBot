import { conversationStore } from "@/lib/conversations/store";
import { sendWhatsAppMessage } from "@/lib/kapso/sendMessage";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params): Promise<Response> {
  const { id } = await ctx.params;
  const body = (await req.json()) as { content?: string };
  if (!body.content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const conversation = conversationStore.getById(id);
  if (!conversation) {
    return Response.json({ error: "conversation not found" }, { status: 404 });
  }

  const message = conversationStore.addMessage({
    conversationId: id,
    sender: "agent",
    content: body.content,
  });
  if (!message) {
    return Response.json({ error: "conversation not found" }, { status: 404 });
  }
  conversationStore.update(id, {
    status: "human_active",
    handoffNeeded: false,
    handoffReason: undefined,
    handoffSummary: undefined,
    handoffRequestedAt: undefined,
  });
  const updatedConversation = conversationStore.getById(id)!;

  if (updatedConversation.leadPhone && updatedConversation.whatsappPhoneNumberId) {
    try {
      await sendWhatsAppMessage(
        updatedConversation.leadPhone,
        body.content,
        updatedConversation.whatsappPhoneNumberId,
      );
      console.log("[kapso] agent mensaje enviado", {
        conversationId: id,
        to: updatedConversation.leadPhone,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[kapso] error enviando mensaje de agente", errorMessage);
    }
  } else {
    console.log("[kapso] agente sin datos whatsapp para envio", {
      conversationId: id,
      leadPhone: updatedConversation.leadPhone,
      whatsappPhoneNumberId: updatedConversation.whatsappPhoneNumberId,
    });
  }

  return Response.json({ conversation: updatedConversation, message });
}
