import { generateReply } from "@/lib/ai/generateReply";
import { buildHandoffReason, buildHandoffSummary } from "@/lib/conversations/handoff";
import { conversationStore } from "@/lib/conversations/store";
import { sendWhatsAppMessage } from "@/lib/kapso/sendMessage";
import {
  getPropertyContext,
  resolvePropertyFromConversationSelection,
  resolvePropertyFromMessage,
  shouldOverrideCurrentProperty,
} from "@/lib/properties/property-resolver";

type KapsoWebhook = {
  type?: string;
  event?: string;
  batch?: boolean;
  data?: unknown;
  conversation?: unknown;
  message?: unknown;
  phone_number_id?: unknown;
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

function getEvents(body: KapsoWebhook): unknown[] {
  if (Array.isArray(body.data)) return body.data;
  if (body.data && typeof body.data === "object") return [body.data];
  return [body];
}

function extractPhone(event: unknown): string | null {
  return (
    readString(getPath(event, ["conversation", "phone_number"])) ||
    readString(getPath(event, ["conversation", "phone"])) ||
    readString(getPath(event, ["message", "from"])) ||
    readString(getPath(event, ["phone_number"])) ||
    readString(getPath(event, ["from"])) ||
    null
  );
}

function extractMessage(event: unknown): string | null {
  return (
    readString(getPath(event, ["message", "content"])) ||
    readString(getPath(event, ["message", "text", "body"])) ||
    readString(getPath(event, ["message", "text"])) ||
    readString(getPath(event, ["message", "body"])) ||
    readString(getPath(event, ["text", "body"])) ||
    readString(getPath(event, ["content"])) ||
    null
  );
}

function extractPhoneNumberId(event: unknown, body: KapsoWebhook): string | null {
  return (
    readString(getPath(event, ["phone_number_id"])) ||
    readString(getPath(event, ["conversation", "phone_number_id"])) ||
    readString(getPath(body, ["phone_number_id"])) ||
    readString(getPath(body, ["conversation", "phone_number_id"])) ||
    null
  );
}

async function processEvent(event: unknown, body: KapsoWebhook): Promise<void> {
  const phone = extractPhone(event);
  const message = extractMessage(event);
  const phoneNumberId = extractPhoneNumberId(event, body);

  if (!message) {
    console.log("[kapso] evento ignorado: sin mensaje", { phone, event });
    return;
  }
  if (!phone) {
    console.log("[kapso] evento ignorado: sin telefono", { message, event });
    return;
  }
  if (!phoneNumberId) {
    console.log("[kapso] evento ignorado: sin phone_number_id", { phone, message, event });
    return;
  }

  console.log("[kapso] mensaje recibido", { phone, message, phoneNumberId });

  const conversation =
    conversationStore.getByLeadPhone(phone) ||
    conversationStore.create({
      leadPhone: phone,
      leadName: `Lead ${phone}`,
    });

  if (conversation.whatsappPhoneNumberId !== phoneNumberId) {
    conversationStore.update(conversation.id, { whatsappPhoneNumberId: phoneNumberId });
  }

  const leadMessage = conversationStore.addMessage({
    conversationId: conversation.id,
    sender: "lead",
    content: message,
  });
  if (!leadMessage) {
    return;
  }

  if (conversation.status === "human_active") {
    console.log("[kapso] conversación en human_active, bot no responde", {
      conversationId: conversation.id,
      phone,
    });
    return;
  }

  const existingProperty = await getPropertyContext(conversation.propertyId);
  const selectedFromOptions = await resolvePropertyFromConversationSelection(message, conversation);
  if (selectedFromOptions) {
    if (conversation.propertyId !== selectedFromOptions.id) {
      conversationStore.update(conversation.id, { propertyId: selectedFromOptions.id });
    }
  }
  const shouldOverride = existingProperty
    ? await shouldOverrideCurrentProperty(message, existingProperty)
    : false;
  const shouldResolveFromMessage = !existingProperty || shouldOverride || Boolean(selectedFromOptions);
  const resolution = !shouldResolveFromMessage
    ? { property: existingProperty, options: [], reason: "exact" as const }
    : selectedFromOptions
      ? { property: selectedFromOptions, options: [], reason: "exact" as const }
      : await resolvePropertyFromMessage(message);
  const property = resolution.property;

  if (property && conversation.propertyId !== property.id) {
    conversationStore.update(conversation.id, { propertyId: property.id });
  }

  const reply = await generateReply({
    conversation: conversationStore.getById(conversation.id)!,
    message,
    property,
    propertyOptions: resolution.options,
    matchedByMessage: resolution.reason === "exact" && Boolean(property),
  });

  conversationStore.setStatus(conversation.id, reply.status);
  conversationStore.addMessage({
    conversationId: conversation.id,
    sender: "bot",
    content: reply.content,
  });

  if (reply.status === "needs_human") {
    const handoffSummary = await buildHandoffSummary({
      conversation: conversationStore.getById(conversation.id)!,
      property,
      leadMessage,
      botReply: reply.content,
    });
    conversationStore.update(conversation.id, {
      handoffNeeded: true,
      handoffRequestedAt: new Date().toISOString(),
      handoffReason: buildHandoffReason(message, reply.content),
      handoffSummary,
    });
  }

  try {
    await sendWhatsAppMessage(phone, reply.content, phoneNumberId);
    console.log("[kapso] respuesta enviada", { phone, reply: reply.content });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[kapso] error enviando whatsapp", errorMessage);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as KapsoWebhook;
    console.log("[kapso] webhook recibido", JSON.stringify(body, null, 2));

    const events = getEvents(body);
    for (const event of events) {
      await processEvent(event, body);
    }

    return Response.json({ ok: true, processed: events.length });
  } catch (error) {
    console.error("[kapso] webhook error", error);
    return Response.json({ ok: true, error: "handled" });
  }
}
