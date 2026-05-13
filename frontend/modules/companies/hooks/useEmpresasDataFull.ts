"use client";

import { useMyEmpresasData } from "./useEmpresasData";

export const useEmpresaDataFull = () => {
  const { empresas, loading, error, mutate } = useMyEmpresasData();

  return {
    empresas,
    loading,
    error,
    mutate,
    mutateEmpresaDataFull: mutate,
  };
};
