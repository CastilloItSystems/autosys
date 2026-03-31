// libs/interfaces/workshop/additional.interface.ts

export type AdditionalStatus = 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED';

export interface ServiceOrderAdditional {
  id: string;
  description: string;
  estimatedPrice: number;
  status: AdditionalStatus;
  serviceOrderId: string;
  serviceOrder?: { id: string; folio: string } | null;
  empresaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdditionalStatus;
  serviceOrderId?: string;
}

export interface CreateAdditionalInput {
  description: string;
  estimatedPrice: number;
  serviceOrderId: string;
}

export interface UpdateAdditionalInput extends Partial<CreateAdditionalInput> {
  status?: AdditionalStatus;
}
