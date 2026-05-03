"use client";
import { useCallback } from "react";
import useSWR from "swr";
import dealerDocumentService from "../services/dealerDocumentService";

type DealerDocumentsParams = Parameters<typeof dealerDocumentService.getAll>[0];

export const useDealerDocumentsData = (params?: DealerDocumentsParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["dealer-documents", params],
    () => dealerDocumentService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
