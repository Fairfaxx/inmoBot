# Flujos de conversación

Cataloga los caminos típicos de un lead inmobiliario en Argentina. Para cada flujo: cuándo se dispara, qué hace el bot, qué dispara handoff. Las reglas de handoff vivirán en `05-handoff-rules.md`.

## Convenciones

- **Lead** = persona que escribe al WhatsApp.
- **Bot** = asistente automático.
- **Asesor** = humano de la inmobiliaria.
- `needs_human` = estado de la conversación que aparece en el dashboard para que el asesor tome control.

---

## F1 — Identificación de la propiedad

**Disparador:** lead escribe sin contexto (ej: "Hola", "consulta") o sin que haya propiedad asociada.

**Flujo:**
1. Bot saluda, se identifica como asistente.
2. Pide dirección, link del aviso, o código de la propiedad.
3. Si el lead nombra una propiedad y matchea exactamente → la asocia y pasa a F2.
4. Si nombra varias o el match es ambiguo → muestra hasta 3 opciones y pide elegir.
5. Si no encuentra nada → pide más datos (zona, ambientes, presupuesto) y deriva a asesor para búsqueda manual.

**Salidas:**
- Propiedad asociada → F2.
- Sin match con datos suficientes → `needs_human`.

---

## F2 — Consulta de datos básicos (precio, ambientes, m2, expensas, balcón)

**Disparador:** lead pregunta por uno de los datos canónicos (palabras clave: *precio, valor, m2, metros, superficie, expensas, balcón, ambientes*).

**Flujo:**
1. Bot responde **directo desde la ficha**, sin rodeos.
2. Mensaje breve (1-2 líneas).
3. Si el dato no está en la ficha → "Te lo averiguo y te confirmo en unos minutos 👍" + `needs_human`.

**Ejemplo:**
> Lead: "cuánto sale?"
> Bot: "USD 180.000."

---

## F3 — Consulta de disponibilidad

**Disparador:** lead pregunta "¿está disponible?", "¿sigue?", o el estado de la propiedad.

**Flujo:**
1. Si `status = available` → confirma disponibilidad, ofrece próxima acción (visita / más info).
2. Si `status = reserved` → "Está reservada, ¿querés que te muestre similares?"
3. Si `status = sold` → "Esa ya se vendió, te puedo pasar opciones similares."
4. Si el lead acepta similares → `needs_human` (hoy no hay motor de búsqueda automático en Tokko todavía).

---

## F4 — Coordinación de visita

**Disparador:** lead dice *"quiero verla", "puedo visitarla", "coordinar visita", "agenda"*.

**Flujo:**
1. Bot **no agenda solo**. Confirma intención y deriva.
2. Mensaje: "¡Perfecto! Te contacto con un asesor para coordinar la visita."
3. Marca `needs_human`.

> Nota: cuando exista integración con calendario (Cal.com / Google Calendar), este flujo se podrá automatizar parcialmente. Hoy: handoff sí o sí.

---

## F5 — Calificación del lead

**Disparador:** lead muestra interés genuino (pregunta varios datos, pide visita, pregunta financiación).

**Flujo conversacional ideal del bot** _(no obligatorio en una sola tanda)_:
1. ¿Es para vivir vos o como inversión?
2. ¿Tenés algún plazo en mente para mudarte / cerrar?
3. ¿Es operación al contado, con crédito o necesita financiación?
4. ¿Estás viendo otras propiedades o solo esta?

**Importante:**
- No interrogar de golpe. Una pregunta de calificación cada 2-3 mensajes.
- Si menciona **crédito hipotecario** → no profundizar, derivar (ver F8).
- Si menciona urgencia ("la necesito esta semana") → derivar.

---

## F6 — Negociación de precio / contraoferta

**Disparador:** lead dice *"se puede negociar", "acepta menos", "te ofrezco X", "está caro"*.

**Flujo:**
1. Bot **no negocia nunca**.
2. Respuesta: "Te paso con un asesor que puede revisar tu propuesta."
3. `needs_human`.

---

## F7 — Pedido de financiación / crédito hipotecario

**Disparador:** lead menciona *"crédito", "hipotecario", "financiación", "cuotas"*.

**Flujo:**
1. Bot **no asesora** sobre créditos.
2. Respuesta: "Para financiación te paso con un asesor que te explica las opciones disponibles."
3. `needs_human`.

---

## F8 — Pedido de visitar varias / búsqueda activa

**Disparador:** lead pide ver varias propiedades, manda criterios de búsqueda ("busco 2 amb en Palermo hasta USD 150k").

**Flujo:**
1. Si hay 1-3 matches en la base actual → mostrar lista corta.
2. Si hay más, o se piden criterios complejos → derivar.
3. Mientras Tokko no esté integrado, búsquedas reales son siempre handoff.

---

## F9 — Lead frío / silencio

**Disparador:** lead deja de responder por > 24 hs.

**Flujo:** _(no implementado todavía)_
1. Recordatorio amable a las 24-48 hs: "¿Sigue interesado/a en la propiedad?"
2. Segundo recordatorio a los 5-7 días.
3. Después de 14 días sin respuesta → status `lost`.

> Pendiente: definir si los recordatorios los hace el bot automáticamente o el asesor manualmente.

---

## F10 — Mensaje fuera de tema / spam / consulta no inmobiliaria

**Disparador:** "¿venden teléfonos?", "necesito un préstamo", saludos sin contenido.

**Flujo:**
1. Bot aclara que es de una inmobiliaria, no se queda colgado en off-topic.
2. Si el lead no aclara intención en 2 turnos → cierra cordial.

---

## F11 — Multimedia (audio, imagen, video, documento)

**Disparador:** Kapso entrega un mensaje no-texto.

**Flujo actual:** el handler **ignora** payloads sin texto (ver `app/api/webhooks/kapso/route.ts:73`).

**Flujo deseado:**
1. Audio → "Por ahora solo leo mensajes escritos, ¿me lo pasás en texto?"
2. Imagen / documento → "Recibí tu archivo, te derivo a un asesor para que lo revise." + `needs_human`.

> Pendiente implementar.

---

## F12 — Lead frustrado / queja / pedido explícito de humano

**Disparador:** *"quiero hablar con una persona", "esto es un bot", insultos, frustración*.

**Flujo:**
1. Bot **no discute**, no se defiende.
2. "Te paso con un asesor enseguida."
3. `needs_human`, sin agregar más mensajes del bot hasta que el humano tome control.

---

## Resumen de cuándo el bot **siempre** deriva

- F4 — Coordinar visita.
- F6 — Negociación de precio.
- F7 — Crédito / financiación.
- F8 — Búsqueda activa que no resuelve la base actual.
- F12 — Pedido explícito de humano o frustración.
- Cualquier dato faltante en la ficha (F2, F3).
- Cualquier mensaje multimedia (cuando se implemente F11).

Las reglas formales y los criterios de handoff están en `05-handoff-rules.md`.
