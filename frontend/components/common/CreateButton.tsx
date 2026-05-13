import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "primereact/button";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { getPermissionGateForPath } from "@/lib/permissionGates";

interface CreateButtonProps {
  label?: string; // Texto del botón
  icon?: string; // Icono primereact (por defecto pi pi-user-plus)
  onClick: () => void; // Acción al crear
  className?: string; // Clases extra
  outlined?: boolean; // Estilo outlined
  size?: "small" | "large" | undefined; // Tamaño primereact
  tooltip?: string; // Tooltip opcional
  tooltipOptions?: any; // Opciones de tooltip
  disabled?: boolean; // Forzar disabled
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
  permissionScope?: "active" | "any";
}

/**
 * Botón reutilizable controlado por permisos efectivos de la empresa activa.
 */
const CreateButton: React.FC<CreateButtonProps> = ({
  label = "Agregar Nuevo",
  icon = "pi pi-plus", // Cambiado para indicar nuevo registro
  onClick,
  className = "w-full sm:w-auto flex-order-0 sm:flex-order-1",
  outlined = true,
  size = "small",
  tooltip = "Agregar Nuevo",
  tooltipOptions,
  disabled = false,
  permission,
  permissionsAny,
  permissionsAll,
  permissionScope = "active",
}) => {
  const pathname = usePathname();
  const { canAccessGate } = useUserPermissions();
  const hasExplicitGate = Boolean(permission || permissionsAny || permissionsAll);
  const gate = hasExplicitGate
    ? { permission, permissionsAny, permissionsAll, scope: permissionScope }
    : getPermissionGateForPath(pathname, "create");

  if (!canAccessGate(gate)) return null;

  return (
    <Button
      type="button"
      icon={icon}
      label={label}
      // outlined={outlined}
      size={size}
      className={className}
      tooltip={tooltip}
      tooltipOptions={tooltipOptions || { position: "top" }}
      onClick={onClick}
      disabled={disabled}
    />
  );
};

export default CreateButton;
