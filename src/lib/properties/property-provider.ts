import type { Property } from "@/types";

export interface PropertyProvider {
  getAll(): Promise<Property[]>;
  getById(id: string): Promise<Property | null>;
  searchByText(query: string): Promise<Property[]>;
}
