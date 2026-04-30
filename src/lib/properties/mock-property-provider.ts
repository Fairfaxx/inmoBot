import { mockProperties } from "@/data/mock-properties";
import type { Property } from "@/types";
import type { PropertyProvider } from "./property-provider";

class MockPropertyProvider implements PropertyProvider {
  async getAll(): Promise<Property[]> {
    return mockProperties;
  }

  async getById(id: string): Promise<Property | null> {
    return mockProperties.find((p) => p.id === id) ?? null;
  }

  async searchByText(query: string): Promise<Property[]> {
    const normalized = query.toLowerCase();
    return mockProperties.filter((property) => {
      return (
        property.id.toLowerCase().includes(normalized) ||
        property.code.toLowerCase().includes(normalized) ||
        property.title.toLowerCase().includes(normalized) ||
        property.address.toLowerCase().includes(normalized) ||
        property.neighborhood.toLowerCase().includes(normalized)
      );
    });
  }
}

export const propertyProvider = new MockPropertyProvider();
