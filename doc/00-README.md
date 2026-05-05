# Documentación del bot inmobiliario

Esta carpeta describe **cómo se debe comportar** el bot que reemplaza al agente inmobiliario, no cómo está construido el código (eso vive en `src/`). El objetivo es tener una fuente única de verdad sobre la conducta del bot, los flujos que tiene que cubrir, y los casos en los que delega.

## Scope asumido (corregir si está mal)

- **Tipo de cliente:** inmobiliarias **medianas** en Argentina.
- **Mercado:** venta y alquiler residencial. _(pendiente confirmar si entra comercial)_.
- **Zona:** sin restricción geográfica explícita por ahora.
- **Hasta dónde llega el bot:** atender el lead inicial, calificarlo, dar info de propiedades, manejar objeciones simples, y **coordinar visita derivando a un asesor humano**. No cierra operaciones ni firma reservas.
- **Integraciones:**
  - **Hoy:** Kapso (WhatsApp) + OpenAI (`gpt-4o-mini`) + datos mock en memoria.
  - **Próximo:** Tokko CRM como fuente real de propiedades (todavía no integrado).
- **Persistencia:** in-memory hoy. Para producción se necesita una DB real (Postgres/Supabase).

## Principios del bot

1. **Nunca inventa datos.** Si un dato no está en la ficha, dice "te lo averiguo y te confirmo".
2. **Nunca dice que es IA** ni habla del modelo. Se presenta como asistente de la inmobiliaria.
3. **Conserva contexto de los últimos N mensajes** (hoy 8 — ver `src/lib/ai/openaiReply.ts:53`). Esto evita que olvide qué propiedad estaba mostrando.
4. **Una propiedad fija por conversación.** Una vez que se asocia, no la cambia por una mención casual del lead.
5. **Delega temprano** cuando hay riesgo de errar (negociación, requisitos legales, agenda real). Mejor pasar al humano que arruinar el lead.
6. **Tono argentino, profesional y breve.** Máximo 2 líneas por mensaje, salvo que sea un resumen estructurado de la propiedad.

## Índice

| Doc | Estado | De qué trata |
|---|---|---|
| [01-product-vision.md](01-product-vision.md) | pendiente | a quién sirve, qué problema resuelve |
| [02-agent-persona.md](02-agent-persona.md) | ✅ v0 | tono, jerga AR, qué nunca hace |
| [03-conversation-flows.md](03-conversation-flows.md) | ✅ v0 | flujos típicos del lead inmobiliario |
| [04-knowledge-base.md](04-knowledge-base.md) | pendiente | qué info es obligatoria para responder |
| [05-handoff-rules.md](05-handoff-rules.md) | ✅ v0 | cuándo derivar a humano |
| [06-objections-faq.md](06-objections-faq.md) | pendiente | objeciones y FAQ |
| [07-prompts.md](07-prompts.md) | ✅ v0 | system prompt y versionado |
| [08-architecture.md](08-architecture.md) | pendiente | mapa técnico |
| [09-roadmap.md](09-roadmap.md) | pendiente | priorización a producción |
| [10-test-scenarios.md](10-test-scenarios.md) | ✅ v0 | casos de prueba end-to-end |

## Cómo evolucionar esta carpeta

- Un cambio de comportamiento del bot **debe** reflejarse acá antes de tocar prompts.
- Cuando un comportamiento queda atado a código específico, linkearlo (`src/...:linea`).
- Si un doc envejece, marcarlo `⚠ desactualizado` arriba del archivo en vez de borrarlo.

## Pendiente de definir con el negocio

Estos puntos bloquean docs siguientes:

- ¿El bot habla de financiación / créditos hipotecarios o eso es siempre humano?
- ¿Maneja precios en USD y ARS, o solo USD para venta y ARS para alquiler?
- ¿Hay horario comercial? ¿Qué hace el bot fuera de horario (deriva igual o solo informa)?
- ¿Qué requisitos legales tiene que pedir el bot vs qué dejar para el humano (garantías, documentación)?
- ¿Hay scripts de venta o material de capacitación interno que podamos usar como insumo?
