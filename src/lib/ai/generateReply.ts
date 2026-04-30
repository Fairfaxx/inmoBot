import type { Conversation, Property } from "@/types";
import { mockAI } from "./mockAI";

type ReplyResult = {
  content: string;
  status: Conversation["status"];
};

function containsAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function formatProperty(property: Property): string {
  const expenses =
    typeof property.expensesArs === "number"
      ? `$${property.expensesArs.toLocaleString("es-AR")} ARS`
      : "No informado";
  const balcony =
    typeof property.balconyM2 === "number" ? `${property.balconyM2} m2` : "No informado";
  return `${property.title} en ${property.address} (${property.neighborhood}).
Precio: USD ${property.priceUsd.toLocaleString("en-US")}. Ambientes: ${property.rooms}. Superficie: ${property.surfaceM2} m2.
Balcón: ${balcony}. Expensas: ${expenses}. Estado: ${property.status}.`;
}

export async function generateReply(input: {
  conversation: Conversation;
  message: string;
  property: Property | null;
  matchedByMessage: boolean;
}): Promise<ReplyResult> {
  const text = input.message.trim();
  const lower = text.toLowerCase();
  const hasVisitIntent = containsAny(lower, [
    "quiero visitar",
    "coordinar visita",
    "puedo verla",
    "visitar",
    "agendar visita",
  ]);

  if (!input.property) {
    return {
      content: "¿Me pasás la dirección, link o código de la propiedad que viste?",
      status: "bot_active",
    };
  }

  if (hasVisitIntent) {
    return {
      content: "¡Perfecto! Te contacto con un asesor para coordinar la visita.",
      status: "needs_human",
    };
  }

  if (input.property.status === "sold" || input.property.status === "reserved") {
    return {
      content:
        `Esta propiedad está ${input.property.status === "sold" ? "vendida" : "reservada"}. ` +
        "Si querés, te busco opciones similares disponibles.",
      status: "bot_active",
    };
  }

  const asksKnownData = containsAny(lower, [
    "precio",
    "ambientes",
    "m2",
    "metros",
    "expensas",
    "balcon",
    "balcón",
    "disponible",
    "disponibilidad",
    "detalle",
    "info",
  ]);

  if (asksKnownData) {
    const asksExpenses = containsAny(lower, ["expensas"]);
    if (asksExpenses && typeof input.property.expensesArs !== "number") {
      return {
        content: "Te lo averiguo y te confirmo en unos minutos 👍",
        status: "needs_human",
      };
    }
    const asksBalcony = containsAny(lower, ["balcon", "balcón"]);
    if (asksBalcony && typeof input.property.balconyM2 !== "number") {
      return {
        content: "Te lo averiguo y te confirmo en unos minutos 👍",
        status: "needs_human",
      };
    }
    return {
      content: formatProperty(input.property),
      status: "bot_active",
    };
  }

  const aiEnabled = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!aiEnabled) {
    return {
      content:
        `Estoy para ayudarte con esta propiedad: ${formatProperty(input.property)} ` +
        "Si querés, también puedo contarte precio, m2, ambientes, expensas y disponibilidad.",
      status: input.matchedByMessage ? "bot_active" : input.conversation.status,
    };
  }

  const generated = await mockAI({
    prompt: `Lead: ${text}\nContexto propiedad: ${formatProperty(input.property)}`,
  });

  return {
    content: generated,
    status: "bot_active",
  };
}
