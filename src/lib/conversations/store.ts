import { mockConversations } from "@/data/mock-conversations";
import type { Conversation, ConversationStatus, Message, MessageSender } from "@/types";

const conversations = [...mockConversations];

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export const conversationStore = {
  list(): Conversation[] {
    return [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  getById(conversationId: string): Conversation | null {
    return conversations.find((c) => c.id === conversationId) ?? null;
  },

  getByLeadPhone(phone: string): Conversation | null {
    const target = normalizePhone(phone);
    return conversations.find((c) => normalizePhone(c.leadPhone) === target) ?? null;
  },

  create(input: {
    leadName?: string;
    leadPhone?: string;
    propertyId?: string;
  }): Conversation {
    const now = nowIso();
    const conversation: Conversation = {
      id: id("conv"),
      clientId: id("lead"),
      leadName: input.leadName?.trim() || "Lead sin nombre",
      leadPhone: input.leadPhone?.trim() || "Sin teléfono",
      propertyId: input.propertyId,
      status: "new",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    conversations.unshift(conversation);
    return conversation;
  },

  update(conversationId: string, patch: Partial<Conversation>): Conversation | null {
    const current = this.getById(conversationId);
    if (!current) return null;
    Object.assign(current, patch, { updatedAt: nowIso() });
    return current;
  },

  addMessage(input: {
    conversationId: string;
    sender: MessageSender;
    content: string;
  }): Message | null {
    const conversation = this.getById(input.conversationId);
    if (!conversation) return null;
    const message: Message = {
      id: id("msg"),
      conversationId: input.conversationId,
      sender: input.sender,
      content: input.content,
      createdAt: nowIso(),
    };
    conversation.messages.push(message);
    conversation.updatedAt = nowIso();
    return message;
  },

  setStatus(conversationId: string, status: ConversationStatus): Conversation | null {
    return this.update(conversationId, { status });
  },
};
