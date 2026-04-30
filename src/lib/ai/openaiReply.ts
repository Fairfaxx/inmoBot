import type { Message, Property } from "@/types";
import OpenAI from "openai";

type OpenAIReplyInput = {
  message: string;
  property: Property | null;
  conversationMessages: Message[];
  conversationStatus: string;
};

const BASE_SYSTEM_PROMPT = `Sos un asistente de WhatsApp para una inmobiliaria argentina.
Respondés en español argentino, tono natural y profesional.
Máximo 2 líneas por mensaje.
Nunca inventás datos.
Si falta un dato, respondés: "Te lo averiguo y te confirmo en unos minutos 👍"
Si el lead quiere coordinar visita, respondés que lo derivás a un vendedor.
Si no hay propiedad asociada, pedís dirección, link o código de la propiedad.
No menciones que sos IA.`;

function propertyContext(property: Property | null): string {
  if (!property) return "Sin propiedad asociada.";
  return JSON.stringify(
    {
      code: property.code,
      title: property.title,
      address: property.address,
      neighborhood: property.neighborhood,
      priceUsd: property.priceUsd,
      rooms: property.rooms,
      surfaceM2: property.surfaceM2,
      balconyM2: property.balconyM2 ?? null,
      expensesArs: property.expensesArs ?? null,
      status: property.status,
      features: property.features,
      description: property.description,
    },
    null,
    2,
  );
}

export async function generateOpenAIReply(input: OpenAIReplyInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  console.log("[openai] using model", model);

  const client = new OpenAI({ apiKey });
  const recent = input.conversationMessages
    .slice(-8)
    .map((m) => {
      if (m.sender === "lead") return `LEAD: ${m.content}`;
      if (m.sender === "bot") return `BOT: ${m.content}`;
      return `AGENT: ${m.content}`;
    })
    .join("\n");

  const propertyIsLocked = Boolean(input.property);
  const systemPrompt = propertyIsLocked
    ? `${BASE_SYSTEM_PROMPT}
Hay una propiedad seleccionada y fija para esta conversación.
Debés mantener esa propiedad como contexto principal y NO cambiarla por historial textual.
Si el lead pide datos, respondé solo con los datos de esta propiedad.`
    : BASE_SYSTEM_PROMPT;

  const structuredContext =
    `Estado conversación: ${input.conversationStatus}\n` +
    `Propiedad seleccionada:\n${propertyContext(input.property)}\n` +
    `Últimos 8 mensajes:\n${recent || "Sin historial"}\n` +
    `Mensaje actual del lead:\n${input.message}`;

  const response = await client.responses.create({
    model,
    max_output_tokens: 180,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: structuredContext,
      },
    ],
  });

  const text = response.output_text?.trim() ?? "";
  if (!text) {
    return null;
  }
  console.log("[openai] response ok");
  return text;
}
