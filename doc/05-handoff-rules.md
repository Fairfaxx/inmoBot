# Reglas de handoff (delegación a humano)

Define **cuándo el bot deja de responder y le pasa la conversación a un asesor**. La premisa es: *mejor delegar de más que arruinar un lead*.

## Estados de conversación involucrados

Definidos en `src/types/index.ts:19`:

| Estado | Significado |
|---|---|
| `new` | Recién creada, todavía no respondió el bot. |
| `bot_active` | Bot manejando la conversación. |
| `needs_human` | Bot detectó que necesita humano. Aparece resaltada en el dashboard. |
| `human_active` | Asesor tomó control. **El bot no responde más.** |
| `closed` | Operación concluida (visita coordinada, lead descartado, etc.). |
| `lost` | Lead inactivo o perdido. |

## Flujo de control

```
new → bot_active → needs_human → human_active → closed
                ↘ closed (si el bot resuelve solo)
                ↘ lost (si lead deja de responder)
```

Una vez en `human_active` el bot **no escribe más en esa conversación** hasta que el asesor explícitamente la libere (este toggle todavía no existe en código — pendiente).

## Criterios de handoff (ordenados por importancia)

### 1. Pedido explícito del lead

Disparadores:
- "Quiero hablar con una persona"
- "Pasame un humano"
- "Esto es un bot?"
- Insultos o frustración evidente.

**Acción:** mensaje breve de transición + `needs_human` + **dejar de responder hasta human_active**.

> Esta regla tiene prioridad absoluta sobre todas las demás.

### 2. Intención de visita

Disparadores: *visita, coordinar, quiero verla, agendar, cuándo puedo ir*.

**Acción:** confirmar intención, prometer contacto del asesor, `needs_human`.

> Implementado hoy en `src/lib/ai/generateReply.ts:166`.

### 3. Negociación o contraoferta

Disparadores: *está caro, ofrezco, contraoferta, descuento, baja, acepta menos*.

**Acción:** "Te paso con un asesor que puede revisar la propuesta." + `needs_human`.

### 4. Financiación / crédito hipotecario

Disparadores: *crédito, hipotecario, financiación, cuotas, banco*.

**Acción:** derivar sin profundizar.

### 5. Dato no disponible en la ficha

Disparadores: lead pregunta algo que la `Property` no tiene.

**Acción:**
- Mensaje canónico: *"Te lo averiguo y te confirmo en unos minutos 👍"*
- `needs_human`.

> Implementado hoy en `src/lib/ai/generateReply.ts` (varios chequeos: `expensesArs`, `balconyM2`, etc.) y en el system prompt de OpenAI (`src/lib/ai/openaiReply.ts:15`).

### 6. Propiedad no encontrada después de 2 intentos

Si el lead da datos para identificar la propiedad y el resolver no encuentra match en 2 turnos consecutivos → derivar para búsqueda manual.

> Pendiente implementar (hoy reintenta indefinidamente).

### 7. Multimedia entrante

Audio, imagen, documento, ubicación, contacto vCard → derivar.

> Pendiente implementar (hoy se ignora silenciosamente, ver `app/api/webhooks/kapso/route.ts:73`).

### 8. Requisitos legales / fiscales / contractuales

Disparadores: *garantía, escritura, expensas extraordinarias, deuda, ABL, sucesión, impuesto, ganancias, monotributo, anses*.

**Acción:** "Esos puntos los conversás con el asesor / escribano." + `needs_human`.

### 9. Urgencia explícita

"La necesito ya", "tengo que mudarme esta semana", "vence el alquiler en 3 días".

**Acción:** mostrar empatía, derivar.

### 10. Errores técnicos del bot

Si OpenAI falla, si el modelo devuelve respuesta vacía, si hay timeout → caer al fallback determinístico (ya implementado, ver `src/lib/ai/generateReply.ts:194`). **No** marcar `needs_human` por un error técnico aislado, pero sí **loguear** y monitorear.

> Si fallan 3 mensajes seguidos en una conversación → `needs_human` defensivo (pendiente implementar).

## Lo que NO debería disparar handoff

- Saludos o small talk.
- Preguntas sobre datos que sí están en la ficha (precio, m2, etc).
- Peticiones de "más info" — el bot manda el resumen estructurado.
- Mensajes vacíos / "ok" / emojis solos — el bot pregunta qué necesita.

## Comportamiento del bot una vez en `needs_human`

- **El bot puede seguir respondiendo** mensajes mientras la conversación está `needs_human`. Esto evita silencio embarazoso si el asesor tarda.
- **El bot NO responde** una vez que la conversación está en `human_active`.
- Cuando el asesor toma control desde el dashboard (`POST /api/conversations/:id/take-control`), el estado pasa a `human_active`.

> ⚠ Hoy el handler del webhook **siempre genera respuesta**, incluso si la conversación está `human_active`. Esto es un bug a resolver — ver "Pendientes" abajo.

## SLA de handoff

_Pendiente definir con el negocio:_

- ¿Cuánto puede tardar el asesor en tomar la conversación antes de que el lead "se enfríe"?
- ¿El bot manda algún mensaje de "alguien te responde en breve" mientras espera al humano?
- ¿En horario no comercial el bot avisa que la respuesta llega al día siguiente?

## Pendientes técnicos relacionados

- [ ] Bug: el webhook responde aunque la conversación esté `human_active`. Hay que cortar en ese caso (`app/api/webhooks/kapso/route.ts` antes de `generateReply`).
- [ ] Implementar handoff por multimedia (F11 en `03-conversation-flows.md`).
- [ ] Implementar contador de "no encontré propiedad" para derivar después de 2 intentos.
- [ ] Implementar contador de errores técnicos consecutivos para `needs_human` defensivo.
- [ ] Notificación al asesor cuando una conversación pasa a `needs_human` (push, mail, slack — definir canal).
