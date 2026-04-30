export async function sendWhatsAppMessage(
  to: string,
  text: string,
  phoneNumberId: string,
): Promise<void> {
  const apiKey = process.env.KAPSO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing KAPSO_API_KEY");
  }
  if (!phoneNumberId) {
    throw new Error("Missing phoneNumberId");
  }

  const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
  const requestBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      body: text,
    },
  };

  console.log("[kapso] sendWhatsAppMessage request", {
    url,
    to,
    body: requestBody,
    hasApiKey: Boolean(apiKey),
    apiKeyPreview: apiKey.length >= 6 ? `${apiKey.slice(0, 3)}***${apiKey.slice(-3)}` : "***",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log("[kapso] sendWhatsAppMessage response", {
    status: response.status,
    body: responseText,
  });

  if (!response.ok) {
    throw new Error(`Kapso API error ${response.status}: ${responseText}`);
  }
}
