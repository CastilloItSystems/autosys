"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProgressSpinner } from "primereact/progressspinner";
import AccessDeniedState from "@/components/auth/AccessDeniedState";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  getPermissionGateForPath,
  type PermissionAction,
} from "@/lib/permissionGates";
import { useEmpresasStore } from "@/store/empresasStore";

interface PermissionGuardProps {
  children: ReactNode;
  action?: PermissionAction;
  fallback?: ReactNode;
}

const LoadingState = () => (
  <div
    className="flex justify-content-center align-items-center"
    style={{ minHeight: "300px" }}
  >
    <ProgressSpinner />
  </div>
);

const PermissionGuard = ({
  children,
  action = "view",
  fallback,
}: PermissionGuardProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const clearActiveEmpresa = useEmpresasStore(
    (state) => state.clearActiveEmpresa,
  );
  const { activeMembership, canAccessGate, isLoading } = useUserPermissions();

  useEffect(() => {
    setMounted(true);
  }, []);

  const gate = useMemo(
    () => getPermissionGateForPath(pathname, action),
    [action, pathname],
  );
  const isEmpresaRoute =
    pathname === "/empresa" || Boolean(pathname?.startsWith("/empresa/"));
  const hasInvalidActiveEmpresa =
    isEmpresaRoute && Boolean(activeEmpresa) && !activeMembership;

  useEffect(() => {
    if (!mounted || isLoading || !hasInvalidActiveEmpresa) return;
    clearActiveEmpresa();
  }, [clearActiveEmpresa, hasInvalidActiveEmpresa, isLoading, mounted]);

  if (!mounted || isLoading) return <LoadingState />;

  if (isEmpresaRoute && (!activeEmpresa || hasInvalidActiveEmpresa)) {
    return (
      <AccessDeniedState
        title="Selecciona una empresa"
        message="Para acceder a los módulos de empresa, primero selecciona una empresa activa."
        icon="pi pi-building"
        primaryLabel="Ir al inicio"
        primaryPath="/"
        showBackButton={false}
      />
    );
  }

  if (!gate) return <>{children}</>;

  if (!canAccessGate(gate)) {
    return (
      <>
        {fallback ?? (
          <AccessDeniedState
            message="No tienes permisos para ver esta página. Si crees que es un error, contacta al administrador."
            primaryLabel="Ir al inicio"
            primaryPath="/"
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
