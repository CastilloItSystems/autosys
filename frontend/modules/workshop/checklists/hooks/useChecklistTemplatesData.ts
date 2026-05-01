import { useCallback } from "react";
import useSWR from "swr";
import checklistService from "@/modules/workshop/checklists/services/checklistService";
import type {
  ChecklistTemplate,
  ChecklistTemplateFilters,
} from "@/modules/workshop/checklists/interfaces/checklist.interface";
import type {
  WorkshopPagedResponse,
  WorkshopResponse,
} from "@/modules/workshop/shared/interfaces/shared.interface";

export const useChecklistTemplatesData = (
  filters?: ChecklistTemplateFilters,
) => {
  const { data, error, isLoading, mutate } = useSWR<
    WorkshopPagedResponse<ChecklistTemplate>
  >(["checklist-templates", filters], () => checklistService.getAll(filters), {
    revalidateOnFocus: false,
  });

  return {
    templates: data?.data ?? [],
    total: data?.meta?.total ?? data?.data?.length ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useChecklistTemplateData = (templateId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<
    WorkshopResponse<ChecklistTemplate>
  >(
    templateId ? ["checklist-template", templateId] : null,
    ([, id]) => checklistService.getById(String(id)),
    { revalidateOnFocus: false },
  );

  return {
    template: data?.data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
