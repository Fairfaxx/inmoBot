import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  const styles =
    message.sender === "lead"
      ? "bg-slate-100 text-slate-900"
      : message.sender === "bot"
        ? "bg-blue-100 text-blue-900"
        : "bg-emerald-100 text-emerald-900";

  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{message.sender}</p>
      <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}
