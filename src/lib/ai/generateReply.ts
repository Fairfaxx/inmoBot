import type { Conversation, Property } from "@/types";
import { generateOpenAIReply } from "./openaiReply";
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

function formatStatus(property: Property): string {
  if (property.status === "available") return "Disponible";
  if (property.status === "reserved") return "Reservada";
  return "Vendida";
}

function deterministicFallback(input: {
  conversation: Conversation;
  message: string;
  property: Property | null;
  propertyOptions?: Property[];
}): ReplyResult {
  const text = input.message.trim();
  const lower = text.toLowerCase();
  const isGreeting = containsAny(lower, [
    "hola",
    "buenas",
    "como estas",
    "cómo estás",
    "que tal",
    "qué tal",
  ]);
  const wantsPrice = containsAny(lower, ["precio", "valor"]);
  const wantsSurface = containsAny(lower, ["m2", "metros", "superficie"]);
  const wantsExpenses = containsAny(lower, ["expensas"]);
  const wantsBalcony = containsAny(lower, ["balcon", "balcón"]);
  const wantsAvailability = containsAny(lower, ["disponible", "disponibilidad", "estado"]);

  if (!input.property) {
    if (input.propertyOptions && input.propertyOptions.length > 0) {
      const options = input.propertyOptions
        .slice(0, 3)
        .map(
          (property) =>
            `- ${property.code}: ${property.title} (${property.address}) - USD ${property.priceUsd.toLocaleString("en-US")}`,
        )
        .join("\n");
      const prefix = isGreeting ? "¡Hola! " : "";
      return {
        content: `${prefix}Encontré varias opciones:\n${options}\n¿Cuál te interesa?`,
        status: "bot_active",
      };
    }
    if (isGreeting) {
      return {
        content:
          "¡Hola! ¿Cómo andás? ¿Estás buscando alguna propiedad en particular? Pasame dirección, código o zona.",
        status: "bot_active",
      };
    }
    return {
      content: "¿Me pasás la dirección, link o código de la propiedad que viste?",
      status: "bot_active",
    };
  }

  if ((wantsAvailability || lower.includes("dispon")) && input.property.status !== "available") {
    return {
      content: `Actualmente está ${formatStatus(input.property).toLowerCase()}. Si querés, te busco opciones similares disponibles.`,
      status: "bot_active",
    };
  }

  if (wantsPrice) {
    return {
      content: `El precio es USD ${input.property.priceUsd.toLocaleString("en-US")}.`,
      status: "bot_active",
    };
  }

  if (wantsSurface) {
    return {
      content: `La superficie es de ${input.property.surfaceM2} m2 y tiene ${input.property.rooms} ambientes.`,
      status: "bot_active",
    };
  }

  if (wantsExpenses) {
    if (typeof input.property.expensesArs !== "number") {
      return {
        content: "Te lo averiguo y te confirmo en unos minutos 👍",
        status: "needs_human",
      };
    }
    return {
      content: `Las expensas son $${input.property.expensesArs.toLocaleString("es-AR")} ARS.`,
      status: "bot_active",
    };
  }

  if (wantsBalcony) {
    if (typeof input.property.balconyM2 !== "number") {
      return {
        content: "Te lo averiguo y te confirmo en unos minutos 👍",
        status: "needs_human",
      };
    }
    return {
      content: `Tiene balcón de ${input.property.balconyM2} m2.`,
      status: "bot_active",
    };
  }

  if (wantsAvailability) {
    return {
      content: `Estado de la propiedad: ${formatStatus(input.property)}.`,
      status: "bot_active",
    };
  }

  const fullSummary = formatProperty(input.property);
  const alreadySentSummary = input.conversation.messages.some(
    (message) => message.sender === "bot" && message.content === fullSummary,
  );
  if (!alreadySentSummary) {
    return { content: fullSummary, status: "bot_active" };
  }

  return {
    content: "¿Querés saber precio, m2, expensas o coordinar una visita?",
    status: "bot_active",
  };
}

export async function generateReply(input: {
  conversation: Conversation;
  message: string;
  property: Property | null;
  propertyOptions?: Property[];
  matchedByMessage: boolean;
}): Promise<ReplyResult> {
  const text = input.message.trim();
  const lower = text.toLowerCase();
  const hasVisitIntent = containsAny(lower, [
    "visita",
    "visitar",
    "coordinar",
    "quiero verla",
    "puedo verla",
    "quiero verlo",
    "puedo verlo",
    "conocerlo",
    "conocerla",
    "verlo en persona",
    "verla en persona",
    "conocer en persona",
    "conocerlo en persona",
    "agendar",
    "ir a verla",
    "ir a verlo",
  ]);
  const isShortAck = containsAny(lower, [
    "dale",
    "ok",
    "oka",
    "perfecto",
    "genial",
    "buenisimo",
    "buenísimo",
    "joya",
    "listo",
    "gracias",
  ]);
  const awaitingHuman = input.conversation.handoffNeeded || input.conversation.status === "needs_human";

  if (hasVisitIntent) {
    return {
      content: "¡Perfecto! Te contacto con un asesor para coordinar la visita.",
      status: "needs_human",
    };
  }

  if (awaitingHuman && isShortAck) {
    const followup = "Perfecto, gracias 🙌 Ya se lo pasé al asesor y te responde por acá en breve.";
    const lastBotMessage = [...input.conversation.messages]
      .reverse()
      .find((message) => message.sender === "bot");
    if (lastBotMessage?.content === followup) {
      return {
        content: "Gracias por la paciencia. En breve te responde el asesor con ese dato puntual.",
        status: "needs_human",
      };
    }
    return { content: followup, status: "needs_human" };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const openAIText = await generateOpenAIReply({
        message: text,
        property: input.property,
        propertyOptions: input.propertyOptions ?? [],
        conversationMessages: input.conversation.messages,
        conversationStatus: input.conversation.status,
        awaitingHuman,
      });
      if (openAIText) {
        const lower = openAIText.toLowerCase();
        const handoffSignal =
          lower.includes("te lo averiguo") ||
          lower.includes("te paso con un asesor") ||
          lower.includes("te contacto con un asesor") ||
          lower.includes("paso con un asesor");
        const status = handoffSignal ? "needs_human" : "bot_active";
        return { content: openAIText, status };
      }
    } catch (error) {
      console.error("[openai] error fallback to deterministic", error);
    }
  }

  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
  if (aiEnabled && input.property) {
    try {
      const generated = await mockAI({
        prompt: `Lead: ${text}\nContexto propiedad: ${formatProperty(input.property)}`,
      });
      return { content: generated, status: "bot_active" };
    } catch (error) {
      console.error("[mockAI] error", error);
    }
  }

  return deterministicFallback({
    conversation: input.conversation,
    message: input.message,
    property: input.property,
    propertyOptions: input.propertyOptions,
  });
}
