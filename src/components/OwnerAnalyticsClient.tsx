"use client";

import type { ConversionMetrics } from "@/lib/metrics/conversion";
import { useEffect, useMemo, useState } from "react";

type AgentMetrics = {
  agentId: string;
  agentName: string;
  metrics: ConversionMetrics;
};

type AnalyticsPayload = {
  global: ConversionMetrics;
  byAgent: AgentMetrics[];
};

type Period = "daily" | "weekly" | "monthly";

type PieSlice = { id: string; label: string; value: number; color: string };

function PercentPill({ value }: { value: number }) {
  const positive = value >= 30;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {value.toFixed(1)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className={`absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-15 ${accent}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Donut({
  closed,
  lost,
}: {
  closed: number;
  lost: number;
}) {
  const total = closed + lost;
  const closedPct = total ? (closed / total) * 100 : 0;
  const circumference = 2 * Math.PI * 52;
  const closedStroke = (closedPct / 100) * circumference;
  const lostStroke = circumference - closedStroke;
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
      <p className="text-sm font-semibold text-slate-700">Cerrados vs perdidos</p>
      <div className="mt-4 flex items-center gap-5">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r="56" fill="#f8fafc" />
          <circle cx="80" cy="80" r="42" fill="white" />
          <text x="80" y="86" textAnchor="middle" className="rotate-90 fill-slate-700 text-[10px]">
            close rate
          </text>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#e2e8f0" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="14"
            strokeDasharray={`${closedStroke} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke="#f97316"
            strokeWidth="14"
            strokeDasharray={`${lostStroke} ${circumference}`}
            strokeDashoffset={-closedStroke}
            strokeLinecap="round"
          />
        </svg>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-600">Cerrados</span>
            <strong>{closed}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-600">Perdidos</span>
            <strong>{lost}</strong>
          </div>
          <div className="pt-2 text-xs text-slate-500">Close rate</div>
          <div className="text-xl font-bold text-slate-900">{closedPct.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function StageBar({
  label,
  value,
  scaleMax,
  colorClass,
}: {
  label: string;
  value: number;
  scaleMax: number;
  colorClass: string;
}) {
  const width = scaleMax > 0 ? Math.round((value / scaleMax) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200/80">
        {value > 0 ? (
          <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${Math.max(1, width)}%` }} />
        ) : null}
      </div>
    </div>
  );
}

function buildPeriodPie(period: Period, metrics: ConversionMetrics): PieSlice[] {
  const newLeads = Math.max(
    0,
    metrics.totalLeads -
      metrics.botActive -
      metrics.needsHuman -
      metrics.humanActive -
      metrics.closed -
      metrics.lost,
  );

  const baseSlices: PieSlice[] = [
    { id: "new", label: "Nuevos", value: newLeads, color: "#38bdf8" },
    { id: "bot", label: "Bot activos", value: metrics.botActive, color: "#6366f1" },
    { id: "needs", label: "Needs human", value: metrics.needsHuman, color: "#8b5cf6" },
    { id: "human", label: "Human active", value: metrics.humanActive, color: "#06b6d4" },
    { id: "closed", label: "Cerrados", value: metrics.closed, color: "#10b981" },
    { id: "lost", label: "Perdidos", value: metrics.lost, color: "#f97316" },
  ];

  if (period === "daily") {
    return baseSlices;
  }

  const factor = period === "weekly" ? 3.5 : 14;
  return baseSlices.map((slice) => ({
    ...slice,
    value: slice.value > 0 ? Math.max(1, Math.round(slice.value * factor)) : 0,
    label:
      period === "weekly"
        ? `${slice.label} (semana)`
        : `${slice.label} (mes)`,
  }));
}

function PiePeriodChart({ slices, title }: { slices: PieSlice[]; title: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 128;
  const center = 154;
  const arcs = slices.map((slice, index) => {
    const prev = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    const next = prev + slice.value;
    const start = (prev / total) * Math.PI * 2;
    const end = (next / total) * Math.PI * 2;
    const x1 = center + radius * Math.cos(start - Math.PI / 2);
    const y1 = center + radius * Math.sin(start - Math.PI / 2);
    const x2 = center + radius * Math.cos(end - Math.PI / 2);
    const y2 = center + radius * Math.sin(end - Math.PI / 2);
    const largeArc = end - start > Math.PI ? 1 : 0;
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...slice, path };
  });

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <svg viewBox="0 0 308 308" className="h-[300px] w-[300px] justify-self-center">
          {total > 0 ? (
            <>
              {arcs.map((arc) => (
                <path key={arc.id} d={arc.path} fill={arc.color} stroke="#fff" strokeWidth="2" />
              ))}
              <circle cx={center} cy={center} r="72" fill="white" />
              <text x={center} y={center - 4} textAnchor="middle" className="fill-slate-900 text-[26px] font-bold">
                {total}
              </text>
              <text x={center} y={center + 18} textAnchor="middle" className="fill-slate-500 text-[12px]">
                conversaciones
              </text>
            </>
          ) : (
            <>
              <circle cx={center} cy={center} r="128" fill="#e2e8f0" />
              <circle cx={center} cy={center} r="72" fill="white" />
              <text x={center} y={center + 6} textAnchor="middle" className="fill-slate-500 text-[14px]">
                Sin datos
              </text>
            </>
          )}
        </svg>
        <div className="grid content-center gap-3">
          {slices.map((slice) => {
            const pct = total ? (slice.value / total) * 100 : 0;
            return (
              <div
                key={slice.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                  {slice.label}
                </span>
                <span className="font-semibold text-slate-900">
                  {slice.value} ({pct.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OwnerAnalyticsClient({ initialData }: { initialData: AnalyticsPayload }) {
  const [data, setData] = useState<AnalyticsPayload>(initialData);
  const [selectedAgent, setSelectedAgent] = useState<string>("global");
  const [period, setPeriod] = useState<Period>("daily");

  async function refresh() {
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as AnalyticsPayload);
    } catch (error) {
      console.error("[owner] analytics refresh error", error);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const current = useMemo(() => {
    if (selectedAgent === "global") return { name: "Global", metrics: data.global };
    const found = data.byAgent.find((agent) => agent.agentId === selectedAgent);
    return found ? { name: found.agentName, metrics: found.metrics } : null;
  }, [data, selectedAgent]);

  if (!current) return <p className="text-sm text-slate-500">Cargando analytics...</p>;
  const m = current.metrics;
  const stageScaleMax = Math.max(40, m.totalLeads, m.botActive, m.needsHuman, m.humanActive, m.closed, m.lost);
  const periodPie = buildPeriodPie(period, m);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Conversion Intelligence
            </p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Vista: {current.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Seguimiento del embudo comercial con foco en cierre y performance del equipo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PercentPill value={m.conversionRate} />
            <select
              className="rounded-xl border border-sky-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="global">Global</option>
              {data.byAgent.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.agentName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads totales" value={m.totalLeads} accent="bg-sky-500" />
        <StatCard label="Conversión" value={`${m.conversionRate.toFixed(1)}%`} accent="bg-emerald-500" />
        <StatCard
          label="Close rate"
          value={`${m.closeVsLostRate.toFixed(1)}%`}
          accent="bg-indigo-500"
        />
        <StatCard label="Needs human" value={m.needsHuman} accent="bg-orange-500" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Embudo por estado
          </h3>
          <div className="mt-4 space-y-3">
            <StageBar label="Bot activos" value={m.botActive} scaleMax={stageScaleMax} colorClass="bg-sky-500" />
            <StageBar label="Needs human" value={m.needsHuman} scaleMax={stageScaleMax} colorClass="bg-violet-500" />
            <StageBar label="Human active" value={m.humanActive} scaleMax={stageScaleMax} colorClass="bg-cyan-500" />
            <StageBar label="Cerrados" value={m.closed} scaleMax={stageScaleMax} colorClass="bg-emerald-500" />
            <StageBar label="Perdidos" value={m.lost} scaleMax={stageScaleMax} colorClass="bg-orange-500" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Escala de referencia fija: {stageScaleMax} leads (evita que 1 se vea como 100%).
          </p>
        </div>
        <Donut closed={m.closed} lost={m.lost} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tendencia temporal
          </h3>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(
              [
                ["daily", "Diaria"],
                ["weekly", "Semanal"],
                ["monthly", "Mensual"],
              ] as Array<[Period, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  period === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <PiePeriodChart
          slices={periodPie}
          title={
            period === "daily"
              ? "Distribución diaria (snapshot real)"
              : period === "weekly"
                ? "Distribución semanal (proyección sobre snapshot)"
                : "Distribución mensual (proyección sobre snapshot)"
          }
        />
      </section>
    </div>
  );
}
