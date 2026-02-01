import { getWorkshops } from "@/app/api";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { Workshop } from "@/libs/interfaces";

// Tipo para el estado consolidado
interface WorkshopData {
  workshops: Workshop[];
}

/**
 * Hook para obtener y manejar todos los datos globales de la aplicación (sin filtrar por refinería), usando SWR.
 * @param recepcionModificado - Recepción modificada para actualizar en el estado
 */
const fetcher = async () => {
  const results = await Promise.allSettled([getWorkshops()]);
  const [workshopsDB] = results.map((r) =>
    r.status === "fulfilled" ? r.value : null
  );

  return {
    workshops: workshopsDB?.workshops || [],
  };
};

export const useWorkshopDataFull = () => {
  const { data, error, isLoading, mutate } = useSWR<WorkshopData>(
    "workshop-data-global",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    ...(data || {}),
    loading: isLoading,
    error,
    // updateRecepciones,
    mutateWorkshopDataFull: useCallback(() => {
      mutate();
    }, [mutate]),
  };
};
