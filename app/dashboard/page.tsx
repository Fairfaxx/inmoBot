import Link from "next/link";
import { DashboardClient } from "@/components/DashboardClient";
import { mockProperties } from "@/data/mock-properties";
import { conversationStore } from "@/lib/conversations/store";
import { getMetrics } from "@/lib/metrics/getMetrics";

export default function DashboardPage() {
  const conversations = conversationStore.list();
  const metrics = getMetrics(conversations);
  const propertiesById = Object.fromEntries(mockProperties.map((p) => [p.id, p]));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard comercial</h1>
        <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-900">
          Volver a simulador
        </Link>
      </div>
      <DashboardClient
        initialData={{
          conversations,
          metrics,
          propertiesById,
        }}
      />
    </main>
  );
}
