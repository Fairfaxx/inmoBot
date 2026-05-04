"use client";

import type { Conversation } from "@/types";

type Props = {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={`w-full rounded-lg border p-3 text-left transition ${
            selectedId === conversation.id
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{conversation.leadName}</p>
            {conversation.handoffNeeded && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Requiere acción
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{conversation.leadPhone}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-600">
            Estado: {conversation.status}
          </p>
        </button>
      ))}
      {conversations.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No hay conversaciones todavía.
        </p>
      )}
    </div>
  );
}
