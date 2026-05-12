"use client";

import { useCallback } from "react";
import useSWR from "swr";
import creditNoteService from "../services/creditNoteService";

type CreditNoteParams = Parameters<typeof creditNoteService.getAll>[0];

export const useCreditNotesData = (params?: CreditNoteParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["sales-credit-notes", params],
    () => creditNoteService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    creditNotes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
