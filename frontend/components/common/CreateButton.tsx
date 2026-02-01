import React from "react";
import { Button } from "primereact/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { createAllowedRoles, hasRole } from "@/lib/roles";

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
}

/**
 * Botón reutilizable controlado por permisos de rol definidos en createAllowedRoles.
 * Muestra null si el usuario no tiene roles permitidos.
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
}) => {
  const roles = useUserRoles();
  const canCreate = hasRole(createAllowedRoles, roles);
  if (!canCreate) return null;

  return (
    <Button
      type="button"
      icon={icon}
      label={label}
      outlined={outlined}
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
