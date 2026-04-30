# MVP - Bot IA para Inmobiliarias (Next.js)

Demo local para validar una idea de producto: un bot que responde leads, usa contexto de propiedades y permite handoff a vendedor desde dashboard.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Route Handlers de Next.js
- Datos mock/in-memory (sin DB real)

## Qué valida este MVP

- Flujo end-to-end de conversación lead -> bot -> dashboard.
- Asociación de propiedad por selección previa o match por texto.
- Respuestas automáticas con datos mock reales (precio, ambientes, m2, expensas, balcón, estado).
- Detección de casos para humano (`needs_human`) cuando:
  - el lead quiere visitar
  - falta información clave
- Toma de control manual desde dashboard (`human_active`).
- Métricas básicas de operación comercial.

## Estructura principal

- `app/` rutas UI y API (App Router)
- `src/components/` UI reusable (`ChatSimulator`, `ConversationList`, `ConversationDetail`, `MetricsCards`)
- `src/lib/` lógica por dominio
  - `ai/` (`generateReply`, `mockAI`)
  - `properties/` (`PropertyProvider`, resolver)
  - `conversations/` store in-memory
  - `metrics/` cálculo de métricas
- `src/data/` mocks de propiedades y conversaciones
- `src/types/` tipos de dominio

## Cómo correr

1. Instalar dependencias:

```bash
npm install
```

2. Levantar entorno local:

```bash
npm run dev
```

3. Abrir:

- Home / simulador: [http://localhost:3000](http://localhost:3000)
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Endpoints incluidos

- `POST /api/chat`
  - recibe mensaje del lead
  - crea/actualiza conversación
  - busca contexto de propiedad
  - genera respuesta bot
- `GET /api/conversations`
  - devuelve conversaciones + métricas + propiedades
- `POST /api/conversations/:id/take-control`
  - pasa conversación a `human_active`
- `POST /api/conversations/:id/messages`
  - agrega mensaje de vendedor

## Reglas del bot (MVP)

- Si detecta propiedad, usa su contexto.
- Si pregunta por datos conocidos, responde desde mock.
- Si falta dato preguntado, responde:
  - `Te lo averiguo y te confirmo en unos minutos 👍`
  - y marca `needs_human`.
- Si pide visita/coordinar, marca `needs_human`.
- Si propiedad está `sold` o `reserved`, ofrece similares.
- Si no identifica propiedad, pide dirección/link/código.

## IA hoy y evolución

- Existe abstracción para motor de IA en `src/lib/ai/generateReply.ts`.
- Si no hay `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`, se mantiene flujo mock/determinístico.
- El diseño permite enchufar luego OpenAI/Claude sin romper API ni UI.

## Qué falta para producción

- Persistencia real (Supabase/Postgres).
- Integración real WhatsApp API.
- Integración real Tokko (nuevo `PropertyProvider`).
- Auth y roles.
- Multi-tenant real.
- Observabilidad, auditoría y retries.
- Tests automáticos (unit + e2e).

## Próximos pasos sugeridos

1. Reemplazar `ConversationStore` in-memory por repositorio Postgres.
2. Implementar `TokkoPropertyProvider` y conmutación por env.
3. Conectar webhook de WhatsApp (entrada/salida).
4. Enchufar proveedor IA real con prompt de negocio + guardrails.
5. Agregar autenticación y separación por inmobiliaria.
