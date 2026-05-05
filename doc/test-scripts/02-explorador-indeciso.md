# Script 2 — Explorador indeciso (caso ambiguo)

**Persona:** Martín, 28 años, sabe que quiere algo en Capital Federal, presupuesto flexible (~$150K-$220K), no tiene barrio definido. Pregunta vago y compara.

**Objetivo del test:** validar que el bot maneja consultas ambiguas, ofrece opciones, y no se "casa" con una propiedad equivocada.

---

## Flujo conversacional

### Turno 1 — Consulta vaga
```
Hola, estoy mirando deptos de 2 ambientes hasta 160 mil dólares
```
**Esperado:** El bot debería listar opciones que matchean (prop-104 en Palermo $129K, prop-107 en Villa Crespo $154K). No elegir una sola.

### Turno 2 — Filtro por barrio (todavía ambiguo)
```
Algo en Palermo tenes?
```
**Esperado:** El bot lista varias en Palermo (prop-101, 104, 105). Idealmente con precio y ambientes para que el lead elija.

### Turno 3 — Selección por opción listada
```
El segundo
```
**Esperado:** El bot resuelve la propiedad seleccionada usando `resolvePropertyFromConversationSelection` y la setea como `propertyId` de la conversación.

### Turno 4 — Cambio de opinión (override)
```
Mejor mostrame el de Villa Crespo
```
**Esperado:** El bot reconoce override (`shouldOverrideCurrentProperty`), cambia `propertyId` a prop-107, no sigue hablando del anterior.

### Turno 5 — Comparación
```
Cuál me conviene más, el de Villa Crespo o el de Palermo de 49m²?
```
**Esperado:** Responde de forma neutral con datos comparativos, sin presionar venta. Si no puede comparar bien, deriva a humano.

---

## Qué verificar

- [ ] El bot NO elige una propiedad en turno 1 (debe ofrecer opciones).
- [ ] La selección numérica/posicional ("el segundo") funciona.
- [ ] El override de propiedad ocurre cuando el lead cambia de idea.
- [ ] No mezcla datos entre propiedades.
- [ ] No genera respuestas duplicadas turno a turno.
