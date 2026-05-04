"use client";

import { useCallback } from "react";
import useSWR from "swr";
import exitNoteService from "@/modules/inventory/exitNotes/services/exitNoteService";

type ExitNoteParams = Parameters<typeof exitNoteService.getAll>[0];

export const useExitNotesData = (params?: ExitNoteParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-exit-notes", params],
    () => exitNoteService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    exitNotes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
