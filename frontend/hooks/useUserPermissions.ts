"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";
import type { UserEmpresaPermission } from "@/modules/users/interfaces/user.interface";
import type { PermissionGate } from "@/lib/permissionGates";

type SessionEmpresaPermission = UserEmpresaPermission & {
  id_empresa?: string;
};

const getSessionEmpresaId = (empresa: SessionEmpresaPermission) =>
  empresa.empresaId || empresa.id_empresa || "";

const isActiveSessionMembership = (empresa: SessionEmpresaPermission) =>
  !empresa.status || empresa.status === "active";

export function useUserPermissions() {
  const { data: session, status } = useSession();
  const activeEmpresaId = useEmpresasStore(
    (state) => state.activeEmpresa?.id_empresa,
  );

  const empresas = useMemo<SessionEmpresaPermission[]>(() => {
    const sessionEmpresas = session?.user?.empresas;
    return Array.isArray(sessionEmpresas) ? sessionEmpresas : [];
  }, [session?.user?.empresas]);

  const activeEmpresas = useMemo(
    () => empresas.filter(isActiveSessionMembership),
    [empresas],
  );

  const activeMembership = useMemo(() => {
    if (!activeEmpresaId) return null;
    return (
      activeEmpresas.find(
        (empresa) => getSessionEmpresaId(empresa) === activeEmpresaId,
      ) ??
      null
    );
  }, [activeEmpresaId, activeEmpresas]);

  const activePermissions = useMemo(
    () => activeMembership?.permissions ?? [],
    [activeMembership?.permissions],
  );

  const allPermissions = useMemo(() => {
    return Array.from(
      new Set(
        activeEmpresas.flatMap((empresa) =>
          Array.isArray(empresa.permissions) ? empresa.permissions : [],
        ),
      ),
    );
  }, [activeEmpresas]);

  const permissions = activePermissions;

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const activePermissionSet = useMemo(
    () => new Set(activePermissions),
    [activePermissions],
  );
  const allPermissionSet = useMemo(
    () => new Set(allPermissions),
    [allPermissions],
  );

  const hasPermission = useCallback(
    (permission?: string | null) => {
      if (!permission) return true;
      return permissionSet.has(permission);
    },
    [permissionSet],
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions?: string[] | null) => {
      if (!requiredPermissions || requiredPermissions.length === 0) return true;
      return requiredPermissions.some((permission) =>
        permissionSet.has(permission),
      );
    },
    [permissionSet],
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions?: string[] | null) => {
      if (!requiredPermissions || requiredPermissions.length === 0) return true;
      return requiredPermissions.every((permission) =>
        permissionSet.has(permission),
      );
    },
    [permissionSet],
  );

  const hasPermissionInAnyEmpresa = useCallback(
    (permission?: string | null) => {
      if (!permission) return true;
      return allPermissionSet.has(permission);
    },
    [allPermissionSet],
  );

  const hasAnyPermissionInAnyEmpresa = useCallback(
    (requiredPermissions?: string[] | null) => {
      if (!requiredPermissions || requiredPermissions.length === 0) return true;
      return requiredPermissions.some((permission) =>
        allPermissionSet.has(permission),
      );
    },
    [allPermissionSet],
  );

  const hasAllPermissionsInAnyEmpresa = useCallback(
    (requiredPermissions?: string[] | null) => {
      if (!requiredPermissions || requiredPermissions.length === 0) return true;
      return requiredPermissions.every((permission) =>
        allPermissionSet.has(permission),
      );
    },
    [allPermissionSet],
  );

  const canAccess = useCallback(
    (gate?: PermissionGate | null) => {
      if (!gate) return true;

      return (
        hasPermission(gate.permission) &&
        hasAnyPermission(gate.permissionsAny) &&
        hasAllPermissions(gate.permissionsAll)
      );
    },
    [hasAllPermissions, hasAnyPermission, hasPermission],
  );

  const canAccessInAnyEmpresa = useCallback(
    (gate?: PermissionGate | null) => {
      if (!gate) return true;

      return (
        hasPermissionInAnyEmpresa(gate.permission) &&
        hasAnyPermissionInAnyEmpresa(gate.permissionsAny) &&
        hasAllPermissionsInAnyEmpresa(gate.permissionsAll)
      );
    },
    [
      hasAllPermissionsInAnyEmpresa,
      hasAnyPermissionInAnyEmpresa,
      hasPermissionInAnyEmpresa,
    ],
  );

  const canAccessGate = useCallback(
    (gate?: PermissionGate | null) => {
      if (gate?.scope === "any") return canAccessInAnyEmpresa(gate);
      return canAccess(gate);
    },
    [canAccess, canAccessInAnyEmpresa],
  );

  return {
    activeMembership,
    activePermissions,
    allPermissions,
    permissions,
    permissionSet,
    activePermissionSet,
    allPermissionSet,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPermissionInAnyEmpresa,
    hasAnyPermissionInAnyEmpresa,
    hasAllPermissionsInAnyEmpresa,
    canAccess,
    canAccessInAnyEmpresa,
    canAccessGate,
    isLoading: status === "loading",
  };
}
