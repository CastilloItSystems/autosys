"use client";

import { useCallback } from "react";
import useSWR from "swr";
import entryNoteService from "@/modules/inventory/entryNotes/services/entryNoteService";

type EntryNoteParams = Parameters<typeof entryNoteService.getAll>[0];

export const useEntryNotesData = (params?: EntryNoteParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    ["inventory-entry-notes", params],
    () => entryNoteService.getAll(params),
    { revalidateOnFocus: false },
  );

  return {
    entryNotes: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
