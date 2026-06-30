"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import apiClient from "@/app/api/apiClient";

/**
 * Permisos del usuario obtenidos del backend (NO desde el token de NextAuth).
 *
 * Antes los permisos viajaban embebidos en la cookie de sesión, lo que la
 * inflaba y producía HTTP 431 (Request Header Fields Too Large). Ahora se
 * piden vía /auth/profile y se cachean con SWR; el token solo lleva la lista
 * de empresas/roles (sin los arrays de permisos).
 */

export const PERMISSIONS_SWR_KEY = "auth-profile-permissions";

export type PermissionsByEmpresa = Record<string, string[]>;

const fetchPermissions = async (): Promise<PermissionsByEmpresa> => {
  const res = await apiClient.get("/auth/profile");
  const empresas = res?.data?.data?.empresas;
  const map: PermissionsByEmpresa = {};
  if (Array.isArray(empresas)) {
    for (const e of empresas) {
      const id = e?.empresa?.id_empresa ?? e?.empresaId;
      if (id) map[id] = Array.isArray(e.permissions) ? e.permissions : [];
    }
  }
  return map;
};

export function usePermissionsData() {
  const { status } = useSession();
  const enabled = status === "authenticated";

  const { data, isLoading, error, mutate } = useSWR(
    enabled ? PERMISSIONS_SWR_KEY : null,
    fetchPermissions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    permissionsByEmpresa: data ?? {},
    isLoading: status === "loading" || (enabled && isLoading && !data),
    error,
    mutate,
  };
}
