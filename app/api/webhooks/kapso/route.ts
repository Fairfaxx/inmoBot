import { generateReply } from "@/lib/ai/generateReply";
import { conversationStore } from "@/lib/conversations/store";
import { sendWhatsAppMessage } from "@/lib/kapso/sendMessage";
import { getPropertyContext, resolvePropertyFromMessage } from "@/lib/properties/property-resolver";

type KapsoWebhook = {
  event?: string;
  data?: unknown;
  conversation?: unknown;
  message?: unknown;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function extractPhone(body: KapsoWebhook): string | null {
  return (
    readString(getPath(body, ["data", "conversation", "phone_number"])) ||
    readString(getPath(body, ["data", "conversation", "phone"])) ||
    readString(getPath(body, ["data", "phone_number"])) ||
    readString(getPath(body, ["data", "from"])) ||
    readString(getPath(body, ["conversation", "phone_number"])) ||
    readString(getPath(body, ["message", "from"])) ||
    null
  );
}

function extractMessage(body: KapsoWebhook): string | null {
  return (
    readString(getPath(body, ["data", "message", "content"])) ||
    readString(getPath(body, ["data", "message", "text"])) ||
    readString(getPath(body, ["data", "content"])) ||
    readString(getPath(body, ["message", "content"])) ||
    readString(getPath(body, ["message", "text"])) ||
    null
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as KapsoWebhook;
    console.log("[kapso] webhook recibido", body);

    if (body.event !== "whatsapp.message.received") {
      console.log("[kapso] evento ignorado", { event: body.event });
      return Response.json({ ok: true, ignored: true });
    }

    const phone = extractPhone(body);
    const message = extractMessage(body);

    if (!phone || !message) {
      console.log("[kapso] payload incompleto", { phone, message, body });
      return Response.json({ ok: true, ignored: true, reason: "missing phone or message" });
    }

    console.log("[kapso] mensaje recibido", { phone, message });

    const conversation =
      conversationStore.getByLeadPhone(phone) ||
      conversationStore.create({
        leadPhone: phone,
        leadName: `Lead ${phone}`,
      });

    conversationStore.addMessage({
      conversationId: conversation.id,
      sender: "lead",
      content: message,
    });

    const resolvedFromMessage = await resolvePropertyFromMessage(message);
    const property = (await getPropertyContext(conversation.propertyId)) || resolvedFromMessage;

    if (property && !conversation.propertyId) {
      conversationStore.update(conversation.id, { propertyId: property.id });
    }

    const reply = await generateReply({
      conversation: conversationStore.getById(conversation.id)!,
      message,
      property,
      matchedByMessage: Boolean(resolvedFromMessage),
    });

    conversationStore.setStatus(conversation.id, reply.status);
    conversationStore.addMessage({
      conversationId: conversation.id,
      sender: "bot",
      content: reply.content,
    });

    await sendWhatsAppMessage(phone, reply.content);
    console.log("[kapso] respuesta enviada", { phone, reply: reply.content });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[kapso] webhook error", error);
    return Response.json({ ok: true, error: "handled" });
  }
}
