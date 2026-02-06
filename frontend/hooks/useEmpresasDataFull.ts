import { getEmpresas } from "@/app/api/empresaService";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import { useCallback, useEffect } from "react";
import useSWR from "swr";

// Tipo para el estado consolidado
interface EmpresaData {
  empresas: Empresa[];
}

/**
 * Hook para obtener y manejar todos los datos globales de la aplicación (sin filtrar por refinería), usando SWR.
 * @param recepcionModificado - Recepción modificada para actualizar en el estado
 */
const fetcher = async () => {
  const results = await Promise.allSettled([getEmpresas()]);
  console.log(results);
  const [empresasDB] = results.map((r) =>
    r.status === "fulfilled" ? r.value : null,
  );

  return {
    empresas: empresasDB?.empresas || [],
  };
};

export const useEmpresaDataFull = () => {
  const { data, error, isLoading, mutate } = useSWR<EmpresaData>(
    "empresa-data-global",
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    ...(data || {}),
    loading: isLoading,
    error,
    // updateRecepciones,
    mutateEmpresaDataFull: useCallback(() => {
      mutate();
    }, [mutate]),
  };
};
