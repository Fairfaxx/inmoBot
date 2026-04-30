export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const apiKey = process.env.KAPSO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing KAPSO_API_KEY");
  }

  const response = await fetch("https://api.kapso.ai/whatsapp/messages", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      type: "text",
      text: {
        body: text,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Kapso API error ${response.status}: ${body}`);
  }
}
