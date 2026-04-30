type AIInput = {
  prompt: string;
};

export async function mockAI({ prompt }: AIInput): Promise<string> {
  return `Respuesta mock IA: ${prompt.slice(0, 180)}`;
}
