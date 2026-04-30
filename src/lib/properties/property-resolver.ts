import type { Property } from "@/types";
import { propertyProvider } from "./mock-property-provider";

export async function resolvePropertyFromMessage(
  message: string,
): Promise<Property | null> {
  const matches = await propertyProvider.searchByText(message);
  return matches[0] ?? null;
}

export async function getPropertyContext(
  propertyId?: string,
): Promise<Property | null> {
  if (!propertyId) {
    return null;
  }
  return propertyProvider.getById(propertyId);
}
