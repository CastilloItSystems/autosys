export type ChecklistCategory = "RECEPTION" | "DIAGNOSIS" | "QUALITY_CONTROL";
export type ChecklistItemType = "BOOLEAN" | "TEXT" | "NUMBER" | "SELECTION";

export interface ChecklistItem {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  responseType: ChecklistItemType;
  isRequired: boolean;
  order: number;
  options?: string[] | null;
  isActive?: boolean;
}

export interface ChecklistTemplate {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: ChecklistCategory;
  isActive: boolean;
  items: ChecklistItem[];
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: ChecklistCategory;
  isActive?: "true" | "false";
}

export interface CreateChecklistTemplateInput {
  code: string;
  name: string;
  description?: string | null;
  category: ChecklistCategory;
  items?: Omit<ChecklistItem, "id">[];
}

export interface UpdateChecklistTemplateInput {
  name?: string;
  description?: string | null;
  category?: ChecklistCategory;
  isActive?: boolean;
  items?: ChecklistItem[];
}
