import apiClient from "../apiClient";
import type { ApiResponse } from "@/libs/interfaces";

export interface UnifiedCatalogItem {
  id: string;
  code: string;
  name: string;
  type: "PART" | "LABOR";
  price: number;
  cost: number;
  taxType: string;
  taxRate: number;
  suggestedItems?: Array<{
    itemId: string | null;
    description: string;
    quantity: number;
    isRequired: boolean;
    notes: string | null;
    unitPrice: number;
    unitCost: number;
    taxType: string;
    taxRate: number;
  }>;
}

class CatalogSearchService {
  private readonly baseUrl = "/workshop/catalogs";

  async search(query: string): Promise<ApiResponse<UnifiedCatalogItem[]>> {
    const response = await apiClient.get(`${this.baseUrl}/search`, {
      params: { q: query },
    });
    return response.data;
  }
}

export const catalogSearchService = new CatalogSearchService();
