"use client";
import { useCallback } from "react";
import useSWR from "swr";
import caseService from "../services/caseService";
import type { Case } from "../interfaces/case.interface";

type CaseParams = Parameters<typeof caseService.getAll>[0];

export const useCasesData = (params?: CaseParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm-cases", params],
    () => caseService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    cases: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCaseKanbanData = (params?: CaseParams) => {
  const data = useCasesData(params);

  return {
    ...data,
    cases: data.cases.filter(
      (caseRecord: Case) =>
        !["CLOSED", "REJECTED"].includes(caseRecord.status as string),
    ),
  };
};
