"use client";

import { useCallback } from "react";
import useSWR from "swr";
import {
  getAuditLogsForEmpresa,
  getEmpresas,
  getMyEmpresas,
} from "../services/empresa.service";
import { getCompanyRoles } from "../services/role.service";
import type {
  AuditLogsResponse,
  EmpresasResponse,
} from "../interfaces/empresa.interface";
import type { CompanyRole } from "../services/role.service";

export const EMPRESAS_SWR_KEY = "empresa-data-global";
export const MY_EMPRESAS_SWR_KEY = "my-empresa-data";

export const useEmpresasData = () => {
  const { data, error, isLoading, mutate } = useSWR<EmpresasResponse>(
    EMPRESAS_SWR_KEY,
    getEmpresas,
    { revalidateOnFocus: false },
  );

  return {
    empresas: data?.empresas ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useMyEmpresasData = () => {
  const { data, error, isLoading, mutate } = useSWR<EmpresasResponse>(
    MY_EMPRESAS_SWR_KEY,
    getMyEmpresas,
    { revalidateOnFocus: false },
  );

  return {
    empresas: data?.empresas ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useEmpresaAuditLogsData = (empresaId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<AuditLogsResponse>(
    empresaId ? ["empresa-audit-logs", empresaId] : null,
    () => getAuditLogsForEmpresa(empresaId as string),
    { revalidateOnFocus: false },
  );

  return {
    auditLogs: data?.auditLogs ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useCompanyRolesData = (empresaId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<CompanyRole[]>(
    empresaId ? ["company-roles", empresaId] : null,
    () => getCompanyRoles(empresaId as string),
    { revalidateOnFocus: false },
  );

  return {
    roles: data ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
