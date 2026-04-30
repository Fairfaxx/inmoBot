"use client";

import { MessageBubble } from "@/components/MessageBubble";
import type { Conversation, Property } from "@/types";
import { useState } from "react";

type Props = {
  conversation: Conversation | null;
  property: Property | null;
  onTakeControl: (conversationId: string) => Promise<void>;
  onSendAgentMessage: (conversationId: string, content: string) => Promise<void>;
};

export function ConversationDetail({
  conversation,
  property,
  onTakeControl,
  onSendAgentMessage,
}: Props) {
  const [agentText, setAgentText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!conversation) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        Seleccioná una conversación para ver el detalle.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{conversation.leadName}</h3>
          <p className="text-xs text-slate-500">
            {conversation.leadPhone} - estado: {conversation.status}
          </p>
        </div>
        {conversation.status !== "human_active" && (
          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            onClick={() => onTakeControl(conversation.id)}
          >
            Tomar control
          </button>
        )}
      </div>

      {property && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold">{property.title}</p>
          <p>{property.address}</p>
          <p>
            USD {property.priceUsd.toLocaleString("en-US")} - {property.rooms} amb -{" "}
            {property.surfaceM2} m2
          </p>
        </div>
      )}

      <div className="space-y-2">
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {conversation.status === "human_active" && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!agentText.trim()) return;
            setLoading(true);
            try {
              await onSendAgentMessage(conversation.id, agentText);
              setAgentText("");
            } finally {
              setLoading(false);
            }
          }}
        >
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Responder como vendedor..."
            value={agentText}
            onChange={(e) => setAgentText(e.target.value)}
          />
          <button
            disabled={loading}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
