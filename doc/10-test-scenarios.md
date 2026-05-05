# Test scenarios (eval suite)

Suite automático para iterar el comportamiento del bot con confianza. Vive en `tests/bot-eval/`.

## Cómo correrlo

```bash
npm run eval
```

Lee todas las propiedades mock como base, ejecuta cada caso (28 hoy), evalúa con assertions deterministas y de juez (LLM), e imprime una tabla pass/fail.

## Estructura

```
tests/bot-eval/
├── cli.ts          ← entry point (carga casos + corre + reporta)
├── runner.ts       ← arma conversación fake y llama generateReply
├── judge.ts        ← LLM-as-judge con prompt estricto y JSON estructurado
├── report.ts       ← imprime tabla por flow + detalle de fallos
├── types.ts        ← tipos (EvalCase, Assertion, etc.)
└── cases/          ← casos en JSON, agrupados por flow
    ├── F01-identification.json
    ├── F02-basic-data.json
    ├── F03-availability.json
    ├── F04-visit.json
    ├── F05-qualification.json
    ├── F06-negotiation.json
    ├── F07-financing.json
    ├── F08-search.json
    ├── F10-off-topic.json
    ├── F12-handoff-explicit.json
    ├── no-invent.json
    └── human-tone.json
```

## Tipo de assertion

| Tipo | Para qué sirve | Costo |
|---|---|---|
| `status` | verificar `bot_active` vs `needs_human` | gratis (determinista) |
| `contains` | verificar que la respuesta contiene un texto exacto | gratis |
| `containsAny` | que contenga al menos uno de varios textos | gratis |
| `notContains` | que NO contenga un texto prohibido | gratis |
| `judge` | rúbrica + criterios `mustPass` evaluados por LLM | ~$0.0002 |

Cada caso puede combinar varios assertions. El caso pasa solo si pasan **todos**.

## Cómo agregar un caso

Editar uno de los JSON existentes o crear uno nuevo en `cases/`. Ejemplo:

```json
{
  "id": "F02-precio",
  "flow": "F02-basic-data",
  "description": "Lead pregunta precio de PAL-3250.",
  "propertyCode": "PAL-3250",
  "history": [
    { "sender": "lead", "content": "hola, vi este aviso" },
    { "sender": "bot", "content": "Hola! Es PAL-3250 en USD 185.000." }
  ],
  "userMessage": "y los m2?",
  "assertions": [
    { "type": "status", "equals": "bot_active" },
    { "type": "contains", "text": "78" },
    {
      "type": "judge",
      "rubric": "Debe responder los m2 sin repetir el precio.",
      "mustPass": ["Responde los m2", "No repite el precio"]
    }
  ]
}
```

Campos:
- `propertyCode`: si el caso necesita una propiedad asociada, el código de `mock-properties.ts`.
- `history`: mensajes previos que el bot ya vio (opcional).
- `userMessage`: el mensaje del lead a evaluar.
- `assertions`: lista de chequeos.

## Costo y tiempos (corrida del 2026-05-01)

- Casos: 28
- Duración: ~80s (cuello de botella: latencia OpenAI).
- Modelos:
  - Bot: `gpt-4o-mini` (env `OPENAI_MODEL`).
  - Juez: `gpt-4o` (env `JUDGE_MODEL`, default `gpt-4o`).
- Costo aprox: **~$0.07 USD por corrida** (mayoría es el juez 4o).
- A 20 corridas/mes: ~$1.40/mes.

> Si querés bajar costo y aceptar más falsos negativos, configurar `JUDGE_MODEL=gpt-4o-mini` antes de correr. Probamos esa combinación y produce alucinaciones del juez (criterios contradictorios entre razonamiento y veredicto).

## Limitaciones conocidas del juez

LLM-as-judge tiene falsos positivos y negativos:

- **Falso negativo**: el bot respondió bien pero el juez fue muy estricto o leyó mal la respuesta. Aparece típicamente en rúbricas con muchos criterios.
- **Falso positivo**: el bot respondió mal pero el juez lo pasó porque la respuesta sonaba plausible.

Mitigaciones:
- Usar `temperature: 0` en el juez (ya configurado en `judge.ts:53`).
- Rúbricas con pocos criterios (3–5 max) y bien específicos.
- Cuando un caso falla varias veces y el bot está bien, ajustar la rúbrica en lugar del bot.

## Cuándo correr el suite

- **Antes** de tocar `BASE_SYSTEM_PROMPT`.
- **Después** de tocar `BASE_SYSTEM_PROMPT` (para comparar).
- Antes de cambiar `generateReply.ts`.
- Al cambiar de modelo (`gpt-4o-mini` → `gpt-4o`, etc.).

## Pendientes

- Permitir filtrar por flow: `npm run eval -- --flow F06`.
- Modo "watch" que recorra solo los fallos previos.
- Output JSON para CI o histórico de baselines.
- Sumar casos para conversaciones largas (10+ turnos) cuando trabajemos en memoria.
