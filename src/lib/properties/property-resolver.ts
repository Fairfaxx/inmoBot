import type { Conversation, Property } from "@/types";
import { propertyProvider } from "./mock-property-provider";

export type PropertyResolution = {
  property: Property | null;
  options: Property[];
  reason: "exact" | "ambiguous" | "none";
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

export async function resolvePropertyFromMessage(message: string): Promise<PropertyResolution> {
  const all = await propertyProvider.getAll();
  const normalizedMessage = normalize(message);
  const messageTokens = tokenize(message);

  const exactByCode = all.find((property) => normalize(property.code) === normalizedMessage);
  if (exactByCode) {
    return { property: exactByCode, options: [], reason: "exact" };
  }

  const exactByAddress = all.find((property) =>
    normalizedMessage.includes(normalize(property.address)),
  );
  if (exactByAddress) {
    return { property: exactByAddress, options: [], reason: "exact" };
  }

  const neighborhoodMatches = all.filter((property) =>
    normalizedMessage.includes(normalize(property.neighborhood)),
  );
  if (neighborhoodMatches.length > 1) {
    return { property: null, options: neighborhoodMatches.slice(0, 3), reason: "ambiguous" };
  }
  if (neighborhoodMatches.length === 1) {
    return { property: neighborhoodMatches[0], options: [], reason: "exact" };
  }

  const tokenMatches = all.filter((property) => {
    const candidate = normalize(
      `${property.code} ${property.title} ${property.address} ${property.neighborhood}`,
    );
    return messageTokens.some((token) => candidate.includes(token));
  });

  if (tokenMatches.length === 1) {
    return { property: tokenMatches[0], options: [], reason: "exact" };
  }
  if (tokenMatches.length > 1) {
    return { property: null, options: tokenMatches.slice(0, 3), reason: "ambiguous" };
  }

  return { property: null, options: [], reason: "none" };
}

function extractOrdinalSelection(text: string): number | null {
  const normalized = normalize(text);
  if (/\b(primero|primera|1|uno|la primera|la 1|opcion 1)\b/.test(normalized)) return 0;
  if (/\b(segundo|segunda|2|dos|la segunda|la 2|opcion 2)\b/.test(normalized)) return 1;
  if (/\b(tercero|tercera|3|tres|la tercera|la 3|opcion 3)\b/.test(normalized)) return 2;
  return null;
}

function extractCodesFromBotOptions(content: string): string[] {
  const matches = content.matchAll(/-\s*([A-Z]{3}-\d{3,5})\s*:/g);
  return [...matches].map((m) => m[1]);
}

export async function resolvePropertyFromConversationSelection(
  message: string,
  conversation: Conversation,
): Promise<Property | null> {
  const selectedIndex = extractOrdinalSelection(message);
  if (selectedIndex === null) return null;

  const lastBotOptionsMessage = [...conversation.messages]
    .reverse()
    .find(
      (m) =>
        m.sender === "bot" &&
        m.content.includes("Encontré varias opciones") &&
        m.content.includes("¿Cuál te interesa?"),
    );
  if (!lastBotOptionsMessage) return null;

  const codes = extractCodesFromBotOptions(lastBotOptionsMessage.content);
  const selectedCode = codes[selectedIndex];
  if (!selectedCode) return null;

  const all = await propertyProvider.getAll();
  return all.find((p) => normalize(p.code) === normalize(selectedCode)) ?? null;
}

export async function getPropertyContext(
  propertyId?: string,
): Promise<Property | null> {
  if (!propertyId) {
    return null;
  }
  return propertyProvider.getById(propertyId);
}

export async function shouldOverrideCurrentProperty(
  message: string,
  currentProperty: Property,
): Promise<boolean> {
  const normalizedMessage = normalize(message);
  const all = await propertyProvider.getAll();

  const mentionsAnyCode = /\b[A-Z]{3}-\d{3,5}\b/i.test(message);
  if (mentionsAnyCode) return true;

  const currentNeighborhood = normalize(currentProperty.neighborhood);
  const mentionedNeighborhoods = all
    .map((p) => normalize(p.neighborhood))
    .filter((n, idx, arr) => arr.indexOf(n) === idx)
    .filter((n) => normalizedMessage.includes(n));

  const mentionsDifferentNeighborhood = mentionedNeighborhoods.some(
    (n) => n !== currentNeighborhood,
  );
  if (mentionsDifferentNeighborhood) return true;

  const explicitSearchIntent = /(busco|me interesa|tienen|tenes|ten[eé]s|quiero ver)/i.test(
    message,
  );
  if (explicitSearchIntent && mentionedNeighborhoods.length > 0) {
    return true;
  }

  return false;
}
