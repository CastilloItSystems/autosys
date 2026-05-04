"use client";

import { useEmpresasData } from "./useEmpresasData";

export const useEmpresaDataFull = () => {
  const { empresas, loading, error, mutate } = useEmpresasData();

  return {
    empresas,
    loading,
    error,
    mutate,
    mutateEmpresaDataFull: mutate,
  };
};
