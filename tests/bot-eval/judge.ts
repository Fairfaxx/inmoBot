import OpenAI from "openai";

export type JudgeVerdict = {
  pass: boolean;
  reason: string;
  inputTokens: number;
  outputTokens: number;
};

const JUDGE_SYSTEM = `Sos un evaluador automatizado. Tu única tarea es chequear si la respuesta del bot cumple cada criterio listado en "Criterios que DEBEN cumplirse".

REGLAS DE EVALUACIÓN (no negociables):
1. Solo evaluás contra los criterios listados literalmente. No agregues criterios propios.
2. Si un criterio no aparece en la lista, no podés usarlo para fallar.
3. Para cada criterio, decidís pass/fail leyendo la respuesta del bot literalmente. Si tenés duda, asumí que pasa.
4. La respuesta global pass=true SOLO si TODOS los criterios listados pasan. Si alguno falla, pass=false.
5. En "reason", citá literalmente el criterio que falló y por qué. Si pass=true, "reason" puede ser breve ("todos los criterios pasaron").

Formato de salida — JSON exacto sin texto adicional, sin code fences:
{ "pass": true|false, "reason": "..." }

Ejemplo de razonamiento correcto:
- Criterio: "No tiene '!!' ni '!!!'". Bot dijo "Hola!". → pasa (un solo '!').
- Criterio: "Máximo 3 oraciones cortas". Bot dijo 3 oraciones. → pasa.
- Criterio: "No menciona ser IA". Bot dijo "soy un asistente virtual". → pasa (no dijo "IA" ni "modelo").`;

export async function judge(input: {
  caseDescription: string;
  userMessage: string;
  botReply: string;
  mustPass: string[];
  rubric: string;
}): Promise<JudgeVerdict> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set for judge");

  const client = new OpenAI({ apiKey });
  const model = process.env.JUDGE_MODEL || "gpt-4o";

  const userContent = `# Contexto del caso
${input.caseDescription}

# Mensaje del lead
${input.userMessage}

# Respuesta del bot a evaluar
${input.botReply}

# Rúbrica
${input.rubric}

# Criterios que DEBEN cumplirse (todos)
${input.mustPass.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Devolvé el JSON con tu veredicto.`;

  const response = await client.responses.create({
    model,
    max_output_tokens: 200,
    temperature: 0,
    input: [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.output_text?.trim() ?? "";
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;

  const parsed = parseJudgeJson(raw);
  if (!parsed) {
    return {
      pass: false,
      reason: `juez devolvió JSON inválido: ${raw.slice(0, 200)}`,
      inputTokens,
      outputTokens,
    };
  }

  return {
    pass: Boolean(parsed.pass),
    reason: typeof parsed.reason === "string" ? parsed.reason : "(sin razón)",
    inputTokens,
    outputTokens,
  };
}

function parseJudgeJson(raw: string): { pass?: unknown; reason?: unknown } | null {
  const trimmed = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
