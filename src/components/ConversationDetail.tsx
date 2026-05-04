"use client";

import { MessageBubble } from "@/components/MessageBubble";
import type { Conversation, Property } from "@/types";
import { useEffect, useRef, useState } from "react";

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length]);

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

      {conversation.handoffNeeded && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Resumen para vendedor
          </p>
          {conversation.handoffReason && (
            <p className="mt-1 text-sm font-medium text-amber-900">{conversation.handoffReason}</p>
          )}
          {conversation.handoffRequestedAt && (
            <p className="mt-1 text-xs text-amber-700">
              Pedido generado: {new Date(conversation.handoffRequestedAt).toLocaleString("es-AR")}
            </p>
          )}
          {conversation.handoffSummary && (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-amber-900">
              {conversation.handoffSummary}
            </pre>
          )}
        </div>
      )}

      <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
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
