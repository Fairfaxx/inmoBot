import { generateOpenAISummary } from "@/lib/ai/openaiReply";
import type { Conversation, Message, Property } from "@/types";

function truncate(value: string, max = 180): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export function buildHandoffReason(message: string, botReply: string): string {
  const text = `${message} ${botReply}`.toLowerCase();
  if (text.includes("expensa")) return "Consulta de expensas sin dato confirmado.";
  if (text.includes("balc") || text.includes("orientac"))
    return "Consulta técnica sin dato en ficha (balcón/orientación).";
  if (text.includes("visita") || text.includes("coordinar")) return "Lead pide coordinar visita.";
  return "El bot no pudo resolver con datos actuales.";
}

function buildFallbackSummary(input: {
  conversation: Conversation;
  property: Property | null;
  leadMessage: Message;
  botReply: string;
}): string {
  const recentLead = [...input.conversation.messages]
    .filter((m) => m.sender === "lead")
    .slice(-3)
    .map((m) => truncate(m.content, 110));

  const propertyLine = input.property
    ? `${input.property.code} - ${input.property.title} (${input.property.address})`
    : "Sin propiedad confirmada";

  const leadIntent = truncate(input.leadMessage.content, 140);
  const botSaid = truncate(input.botReply, 140);

  return [
    `Propiedad: ${propertyLine}`,
    `Último pedido del lead: ${leadIntent}`,
    `Bot respondió: ${botSaid}`,
    `Contexto reciente lead: ${recentLead.join(" | ") || "n/a"}`,
    "Grado de interés: medio — sin datos suficientes para clasificar automáticamente.",
  ].join("\n");
}

export async function buildHandoffSummary(input: {
  conversation: Conversation;
  property: Property | null;
  leadMessage: Message;
  botReply: string;
}): Promise<string> {
  const aiSummary = await generateOpenAISummary({
    property: input.property,
    conversationMessages: input.conversation.messages,
    leadMessageContent: input.leadMessage.content,
    botReply: input.botReply,
  });

  return aiSummary ?? buildFallbackSummary(input);
}
