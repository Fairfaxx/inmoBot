import type { Property } from "@/types";
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

export async function getPropertyContext(
  propertyId?: string,
): Promise<Property | null> {
  if (!propertyId) {
    return null;
  }
  return propertyProvider.getById(propertyId);
}
