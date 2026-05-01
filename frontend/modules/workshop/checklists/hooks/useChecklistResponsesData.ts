import { useCallback, useMemo } from "react";
import useSWR from "swr";
import checklistService from "@/modules/workshop/checklists/services/checklistService";
import type {
  ChecklistResponse,
  ChecklistResponsesData,
} from "@/modules/workshop/checklists/interfaces/checklist.interface";
import type { WorkshopResponse } from "@/modules/workshop/shared/interfaces/shared.interface";

const normalizeChecklistResponses = (
  responseData: ChecklistResponsesData | undefined,
): ChecklistResponse[] => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  return responseData?.data ?? [];
};

export const useChecklistResponsesData = (receptionId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<
    WorkshopResponse<ChecklistResponsesData>
  >(
    receptionId ? ["checklist-responses", receptionId] : null,
    ([, id]) => checklistService.getChecklistResponses(String(id)),
    { revalidateOnFocus: false },
  );

  const responses = useMemo(
    () => normalizeChecklistResponses(data?.data),
    [data?.data],
  );

  return {
    responses,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
