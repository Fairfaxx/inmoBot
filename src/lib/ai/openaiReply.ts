import type { Message, Property } from "@/types";
import OpenAI from "openai";

type OpenAIReplyInput = {
  message: string;
  property: Property | null;
  conversationMessages: Message[];
};

const SYSTEM_PROMPT = `Sos un asistente de WhatsApp para una inmobiliaria argentina.
Respondés en español argentino, tono natural y profesional.
Máximo 2 líneas por mensaje.
Si hay una propiedad asociada, respondés SOLO usando esos datos.
Nunca inventás datos.
Si falta un dato, respondés: "Te lo averiguo y te confirmo en unos minutos 👍"
Si el lead quiere coordinar visita, respondés que lo derivás a un vendedor.
Si no hay propiedad asociada, pedís dirección, link o código de la propiedad.
No menciones que sos IA.`;

function propertyContext(property: Property | null): string {
  if (!property) return "Sin propiedad asociada.";
  return JSON.stringify(
    {
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
  const recent = input.conversationMessages.slice(-8).map((m) => ({
    sender: m.sender,
    content: m.content,
  }));

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content:
          `Contexto propiedad:\n${propertyContext(input.property)}\n\n` +
          `Últimos mensajes:\n${JSON.stringify(recent, null, 2)}\n\n` +
          `Mensaje actual del lead:\n${input.message}`,
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
