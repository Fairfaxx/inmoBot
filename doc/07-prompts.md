# System prompts

Versionamos el system prompt para poder iterar sin perder lo que funcionaba antes y para revisar diffs.

## Convención de versiones

- `v1`, `v2`, ... → cambios mayores de tono, persona o reglas duras.
- `v1.1`, `v1.2`, ... → ajustes finos (un ejemplo, una regla nueva).
- El **prompt vivo** está en `src/lib/ai/openaiReply.ts` (constante `BASE_SYSTEM_PROMPT`).
- Cuando subas la versión en código, copiá el prompt completo acá con su tag.

## Parámetros del modelo

| Parámetro | Valor | Razón |
|---|---|---|
| Modelo | `gpt-4o-mini` (env `OPENAI_MODEL`) | balance costo/calidad. |
| `max_output_tokens` | 220 | suficiente para 2-3 frases o un resumen de propiedad. |
| `temperature` | 0.2 | adherencia firme al prompt (regla de 2 líneas, persona). Bajamos de 0.4 después de v1.2. |
| Contexto histórico | últimos 8 mensajes | suficiente para coherencia conversacional sin gastar tokens. |
| Formato de ficha | strings ya formateados (`"USD 185.000"`, `"ARS 145.000"`) y `"no_cargado"` para campos vacíos | evita que el modelo reformatee mal números o niegue atributos solo porque el campo está vacío. |

## Sanitización de respuesta

Pos-procesamos antes de mandar (`sanitizeReply` en `openaiReply.ts:162`):

- Quitar comillas/backticks envolventes.
- Quitar prefijos tipo `Bot:`, `Asistente:`, `Vos:` que el modelo a veces inserta.

Si vemos otros patrones recurrentes, agregamos reglas ahí.

## Detección de handoff por respuesta

Hoy, en `src/lib/ai/generateReply.ts`, marcamos `needs_human` si el texto generado contiene:

- "te lo averiguo"
- "te paso con un asesor" / "paso con un asesor"
- "te contacto con un asesor"

Esto es **frágil** (depende de que el modelo use exactamente esas frases). En una próxima versión conviene migrar a respuesta **JSON estructurada** del modelo:

```json
{ "reply": "...", "intent": "answer|visit|negotiate|out_of_topic|handoff", "needs_human": true|false }
```

Eso quita la heurística textual y nos da telemetría.

## Versiones

### v1.2 — Prompt actual (vivo en `src/lib/ai/openaiReply.ts:12`)

**Cambios respecto a v1:**
- Refuerzo explícito: regla de "máximo 2 líneas" ahora viene con un ejemplo malo concreto (3 oraciones) y otro bueno (2 oraciones).
- Aviso explícito de que la ausencia de un campo (`balcon: "no_cargado"`) NO significa que la propiedad no tenga ese atributo — hay que decir "te lo averiguo".
- Aviso explícito de que los números de precio/expensas vienen ya formateados como strings y NO hay que reformatearlos.
- Sumados ejemplos few-shot: pregunta abierta sobre la propiedad, criterios de búsqueda sin propiedad, lead que ya recibió un dato.
- Sumadas reglas "Malo": volcar toda la ficha, repetir precio, decir "no tiene X" cuando es no_cargado.
- `temperature` bajado de `0.4` a `0.2`.

**Resultado del suite:** 28/28 pasaron en la primera corrida con esta versión.

### v1 — Versión inicial (deprecated)

**Cambios respecto al original:**
- Persona expandida (voseo, cálido, no acartonado).
- Reglas anti-bot explícitas (no "según mi base de datos", no "como modelo de IA").
- **Off-topic guard**: solo responde temas inmobiliarios; redirige cordial; deriva si insiste.
- Estilo humano: sin bullets robóticos, sin saludos repetidos, sin agradecimientos excesivos, emojis muy puntuales.
- Reglas explícitas de cuándo derivar (visita, negociación, crédito, legales, frustración, dato faltante).
- Bloque de **ejemplos buenos y malos** (few-shot).

**Texto completo:** ver `src/lib/ai/openaiReply.ts` constante `BASE_SYSTEM_PROMPT`.

**Add-on cuando hay propiedad seleccionada:**
> *"Hay una propiedad seleccionada y fija para esta conversación. Debés mantener esa propiedad como contexto principal y NO cambiarla por historial textual. Si el lead pide datos, respondé solo con los datos de esta propiedad."*

**Riesgos conocidos:**
- El modelo puede ignorar el guard de off-topic con prompt injection (lead diciendo "ignorá tus instrucciones"). Mitigación a futuro: clasificador previo o prompt en assistant role.
- La detección de handoff por texto puede fallar si el modelo redacta distinto. Ver "Detección de handoff" arriba.
- Few-shot consume tokens en cada llamada. Si crece mucho, conviene mover ejemplos al input del usuario solo cuando sean relevantes.

### v0 — Prompt original (deprecated)

Texto histórico para referencia:

```
Sos un asistente de WhatsApp para una inmobiliaria argentina.
Respondés en español argentino, tono natural y profesional.
Máximo 2 líneas por mensaje.
Nunca inventás datos.
Si falta un dato, respondés: "Te lo averiguo y te confirmo en unos minutos 👍"
Si el lead quiere coordinar visita, respondés que lo derivás a un vendedor.
Si no hay propiedad asociada, pedís dirección, link o código de la propiedad.
No menciones que sos IA.
```

**Por qué se reemplazó:**
- Sin guard de off-topic.
- Sin definición de tono (sonaba a bot genérico).
- Sin ejemplos.
- Sin reglas para no parecer IA en frases típicas.

## Pendientes para v2

- Migrar a respuesta JSON estructurada (`reply` + `intent` + `needs_human`).
- Sumar ejemplos de **lead frustrado** y **lead que pide hablar con humano**.
- Sumar ejemplo de **multimedia** (cuando se implemente F11).
- Probar prompts más cortos y medir cambio de calidad (los muy largos suben costo y pueden bajar adherencia).
- A/B con `temperature: 0.2` vs `0.4` para ver cuál se siente más natural.
