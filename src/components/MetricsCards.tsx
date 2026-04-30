import type { Metrics } from "@/lib/metrics/getMetrics";

export function MetricsCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: "Leads totales", value: metrics.totalLeads },
    { label: "Leads activos", value: metrics.activeLeads },
    { label: "Needs human", value: metrics.needsHuman },
    { label: "Cerrados", value: metrics.closed },
    { label: "Perdidos", value: metrics.lost },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
