import type { Conversation } from "@/types";

const now = new Date().toISOString();

export const mockConversations: Conversation[] = [
  {
    id: "conv-seed-1",
    clientId: "client-seed-1",
    leadName: "Lucia Gomez",
    leadPhone: "+54 9 11 5555-1122",
    propertyId: "prop-101",
    status: "needs_human",
    messages: [
      {
        id: "msg-seed-1",
        conversationId: "conv-seed-1",
        sender: "lead",
        content: "Hola! Me interesa Santa Fe 3250, puedo visitarla mañana?",
        createdAt: now,
      },
      {
        id: "msg-seed-2",
        conversationId: "conv-seed-1",
        sender: "bot",
        content: "¡Claro! Ya aviso al asesor para coordinar la visita.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
];
