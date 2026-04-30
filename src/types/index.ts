export type PropertyStatus = "available" | "reserved" | "sold";

export type Property = {
  id: string;
  code: string;
  title: string;
  address: string;
  neighborhood: string;
  priceUsd: number;
  rooms: number;
  surfaceM2: number;
  balconyM2?: number;
  expensesArs?: number;
  description: string;
  status: PropertyStatus;
  features: string[];
};

export type ConversationStatus =
  | "new"
  | "bot_active"
  | "needs_human"
  | "human_active"
  | "closed"
  | "lost";

export type MessageSender = "lead" | "bot" | "agent";

export type Message = {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  clientId: string;
  leadName: string;
  leadPhone: string;
  whatsappPhoneNumberId?: string;
  propertyId?: string;
  status: ConversationStatus;
  assignedAgentId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type ChatRequest = {
  conversationId?: string;
  leadName?: string;
  leadPhone?: string;
  propertyId?: string;
  content: string;
};

export type ChatResponse = {
  conversation: Conversation;
  botMessage: Message;
};
