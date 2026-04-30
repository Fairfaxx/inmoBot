import Link from "next/link";
import { ChatSimulator } from "@/components/ChatSimulator";
import { mockProperties } from "@/data/mock-properties";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MVP Bot IA Inmobiliaria</h1>
          <p className="text-sm text-slate-600">
            Demo local para validar respuesta automática de leads + handoff humano.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ir al dashboard
        </Link>
      </div>
      <ChatSimulator properties={mockProperties} />
    </main>
  );
}
