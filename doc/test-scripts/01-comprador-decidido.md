# Script 1 — Comprador decidido (camino feliz)

**Persona:** Lucia, 34 años, busca depto en Palermo, ya tiene presupuesto cerrado y quiere coordinar visita.

**Objetivo del test:** validar que el bot identifica una propiedad puntual, responde con datos correctos y avanza hacia coordinación.

---

## Flujo conversacional

### Turno 1 — Saludo + interés general
```
Hola! Vi el aviso del depto en Palermo, sigue disponible?
```
**Esperado:** El bot saluda, pide más detalle (calle/precio) o lista las opciones de Palermo (prop-101, 104, 105).

### Turno 2 — Especificar propiedad
```
El de Av. Santa Fe 3250
```
**Esperado:** El bot reconoce prop-101, confirma disponibilidad, da precio ($185K), ambientes (3), m² (78).

### Turno 3 — Pregunta concreta sobre features
```
Tiene cochera? Acepta mascotas?
```
**Esperado:** Responde según los atributos reales de prop-101. Si no tiene el dato, debería decirlo, no inventar.

### Turno 4 — Avanzar
```
Me encanta. Cuándo puedo ir a verlo?
```
**Esperado:** El bot ofrece coordinar visita o deriva a un humano (handoff). Status pasa a `needs_human` con razón clara.

---

## Qué verificar

- [ ] Conversación queda asociada al teléfono del lead.
- [ ] `propertyId` se setea a `prop-101` después del turno 2.
- [ ] Las respuestas no repiten contenido entre turnos.
- [ ] Al pedir visita, se dispara handoff (`handoffNeeded: true`) con resumen útil.
- [ ] Aparece en `/dashboard` en tiempo real.
