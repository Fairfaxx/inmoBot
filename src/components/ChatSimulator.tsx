"use client";

import type { ChatResponse, Property } from "@/types";
import { useState } from "react";

export function ChatSimulator({ properties }: { properties: Property[] }) {
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [content, setContent] = useState("");
  const [reply, setReply] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Simulador de lead (WhatsApp)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enviá un mensaje como si fuera WhatsApp y mirá cómo responde el bot.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!content.trim()) return;
          setLoading(true);
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                leadName,
                leadPhone,
                propertyId: propertyId || undefined,
                content,
              }),
            });
            const data = (await res.json()) as ChatResponse;
            setReply(data);
            setContent("");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombre (opcional)"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Teléfono (opcional)"
            value={leadPhone}
            onChange={(e) => setLeadPhone(e.target.value)}
          />
        </div>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="">Sin propiedad preseleccionada</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title} - {property.address}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          rows={4}
          placeholder="Escribí el mensaje del lead..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Enviar mensaje
        </button>
      </form>

      {reply && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-xs uppercase tracking-wide text-blue-700">Respuesta del bot</p>
          <p className="mt-1 text-sm text-blue-950">{reply.botMessage.content}</p>
          <p className="mt-2 text-xs text-blue-700">
            Conversación: {reply.conversation.id} - estado: {reply.conversation.status}
          </p>
        </div>
      )}
    </div>
  );
}
