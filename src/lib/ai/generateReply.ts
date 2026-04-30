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

export async function generateReply(input: {
  conversation: Conversation;
  message: string;
  property: Property | null;
  propertyOptions?: Property[];
  matchedByMessage: boolean;
}): Promise<ReplyResult> {
  const fallback = async (): Promise<ReplyResult> => {
    const text = input.message.trim();
    const lower = text.toLowerCase();
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
        return {
          content: `Encontré varias opciones:\n${options}\n¿Cuál te interesa?`,
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
      return {
        content: fullSummary,
        status: "bot_active",
      };
    }

    const clarifyMessage = "¿Querés saber precio, m2, expensas o coordinar una visita?";
    const lastBotMessage = [...input.conversation.messages]
      .reverse()
      .find((message) => message.sender === "bot");
    if (lastBotMessage?.content === clarifyMessage) {
      return {
        content: "Si querés, también puedo pasarte disponibilidad o ayudarte a coordinar visita.",
        status: "bot_active",
      };
    }

    const aiEnabled = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
    if (!aiEnabled) {
      return {
        content: clarifyMessage,
        status: "bot_active",
      };
    }

    const generated = await mockAI({
      prompt: `Lead: ${text}\nContexto propiedad: ${formatProperty(input.property)}`,
    });

    return {
      content: generated,
      status: "bot_active",
    };
  };

  const text = input.message.trim();
  const lower = text.toLowerCase();
  const hasVisitIntent = containsAny(lower, ["visita", "coordinar", "quiero verla", "puedo verla"]);

  if (hasVisitIntent) {
    return {
      content: "¡Perfecto! Te contacto con un asesor para coordinar la visita.",
      status: "needs_human",
    };
  }

  if (process.env.OPENAI_API_KEY && input.property) {
    try {
      const openAIText = await generateOpenAIReply({
        message: text,
        property: input.property,
        conversationMessages: input.conversation.messages,
        conversationStatus: input.conversation.status,
      });
      if (openAIText) {
        const openAILower = openAIText.toLowerCase();
        const status = openAILower.includes("te lo averiguo")
          ? "needs_human"
          : "bot_active";
        return {
          content: openAIText,
          status,
        };
      }
    } catch (error) {
      console.error("[openai] error fallback to mock", error);
    }
  }

  return fallback();
}
