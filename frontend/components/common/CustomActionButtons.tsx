import React, { useRef } from "react";
import { useUserRoles } from "../../hooks/useUserRoles";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import PDFGenerator from "../pdf/PDFGenerator";
import {
  infoAllowedRoles,
  editAllowedRoles,
  deleteAllowedRoles,
  duplicateAllowedRoles,
  pdfAllowedRoles,
  hasRole,
} from "../../lib/roles";

interface CustomActionButtonsProps<T> {
  rowData: T; // Datos de la fila
  onInfo?: (rowData: T) => void; // nueva prop para info
  onEdit?: (rowData: T) => void; // Acción para editar
  onDelete?: (rowData: T) => void; // Acción para eliminar
  onDuplicate?: (rowData: T) => void; // Acción para copiar
  onViewPayments?: (rowData: T) => void; // Acción para ver pagos
  onAddPayment?: (rowData: T) => void; // Acción para agregar pago
  /** Plantilla dinámica para generar el PDF */
  pdfTemplate?: React.ComponentType<{ data: T }>;
  /** Nombre de archivo para descarga */
  pdfFileName?: string;
  /** Texto del botón de descarga */
  pdfDownloadText?: string;
  /** Roles permitidos para mostrar acciones (opcional, por defecto ["admin"]) */
  allowedRoles?: string[];
}

function CustomActionButtons<T>(props: CustomActionButtonsProps<T>) {
  const {
    rowData,
    onInfo,
    onEdit,
    onDelete,
    onDuplicate,
    onViewPayments,
    onAddPayment,
    pdfTemplate: Template,
    pdfFileName = "documento.pdf",
    pdfDownloadText = "Descargar PDF",
  } = props;
  // Obtener roles del usuario con hook reutilizable
  const userRoles = useUserRoles();

  // Usar función y arrays reutilizables
  const can = (allowed: string[]) => hasRole(allowed, userRoles);

  // Si el usuario no tiene acceso a ningún botón, no renderizar nada
  if (
    !can(infoAllowedRoles) &&
    !can(editAllowedRoles) &&
    !can(deleteAllowedRoles) &&
    !can(duplicateAllowedRoles) &&
    !can(pdfAllowedRoles) &&
    !can(editAllowedRoles) && // Para ver pagos usamos edit roles
    !can(editAllowedRoles) // Para agregar pago usamos edit roles
  ) {
    return null;
  }

  // Hook para detectar sm o md (menos de 1024px)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 1024);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Crear items del menú
  const menuItems = [];
  if (onInfo && can(infoAllowedRoles)) {
    menuItems.push({
      label: "Ver Historial",
      icon: "pi pi-info-circle",
      command: () => onInfo(rowData),
    });
  }
  if (onEdit && can(editAllowedRoles)) {
    menuItems.push({
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => onEdit(rowData),
    });
  }
  if (onDelete && can(deleteAllowedRoles)) {
    menuItems.push({
      label: "Eliminar",
      icon: "pi pi-trash",
      command: () => onDelete(rowData),
    });
  }
  if (onDuplicate && can(duplicateAllowedRoles)) {
    menuItems.push({
      label: "Copiar Información",
      icon: "pi pi-copy",
      command: () => onDuplicate(rowData),
    });
  }
  if (onViewPayments && can(editAllowedRoles)) {
    menuItems.push({
      label: "Ver Pagos",
      icon: "pi pi-dollar",
      command: () => onViewPayments(rowData),
    });
  }
  if (onAddPayment && can(editAllowedRoles)) {
    menuItems.push({
      label: "Agregar Pago",
      icon: "pi pi-plus",
      command: () => onAddPayment(rowData),
    });
  }
  if (Template && can(pdfAllowedRoles)) {
    menuItems.push({
      label: pdfDownloadText,
      icon: "pi pi-file-pdf",
      command: () => {}, // El PDFGenerator se muestra oculto
    });
  }

  const menuRef = useRef<any>(null);

  if (isMobile) {
    return (
      <div className="flex justify-content-center align-items-center w-full">
        <Button
          icon="pi pi-bars"
          rounded
          size="small"
          aria-label="Más acciones"
          className="p-button-text"
          onClick={(e) => menuRef.current?.toggle(e)}
        />
        <Menu model={menuItems} popup ref={menuRef} />
        {/* PDFGenerator solo visible en desktop, para móvil solo icono oculto */}
        {Template && can(pdfAllowedRoles) && (
          <span style={{ display: "none" }}>
            <PDFGenerator
              template={Template}
              data={rowData}
              fileName={pdfFileName}
              downloadText={pdfDownloadText}
            />
          </span>
        )}
      </div>
    );
  }

  // Desktop: mostrar botones individuales
  return (
    <div className="flex gap-1 flex-column justify-content-center align-items-center sm:flex-row ">
      {onInfo && can(infoAllowedRoles) && (
        <Button
          icon="pi pi-info-circle"
          rounded
          size="small"
          severity="info"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Ver Historial"
          tooltipOptions={{ position: "top" }}
          onClick={() => onInfo(rowData)}
        />
      )}
      {onEdit && can(editAllowedRoles) && (
        <Button
          icon="pi pi-pencil"
          rounded
          size="small"
          severity="success"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={() => onEdit(rowData)}
        />
      )}
      {onDelete && can(deleteAllowedRoles) && (
        <Button
          icon="pi pi-trash"
          rounded
          size="small"
          severity="danger"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => onDelete(rowData)}
        />
      )}
      {onDuplicate && can(duplicateAllowedRoles) && (
        <Button
          icon="pi pi-copy"
          rounded
          size="small"
          severity="info"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Copiar Información"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            onDuplicate(rowData);
          }}
        />
      )}
      {onViewPayments && can(editAllowedRoles) && (
        <Button
          icon="pi pi-dollar"
          rounded
          size="small"
          severity="help"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Ver Pagos"
          tooltipOptions={{ position: "top" }}
          onClick={() => onViewPayments(rowData)}
        />
      )}
      {onAddPayment && can(editAllowedRoles) && (
        <Button
          icon="pi pi-plus"
          rounded
          size="small"
          severity="success"
          className="p-button-xs w-full sm:w-auto"
          tooltip="Agregar Pago"
          tooltipOptions={{ position: "top" }}
          onClick={() => onAddPayment(rowData)}
        />
      )}
      {Template && can(pdfAllowedRoles) && (
        <PDFGenerator
          template={Template}
          data={rowData}
          fileName={pdfFileName}
          downloadText={pdfDownloadText}
        />
      )}
    </div>
  );
}

export default CustomActionButtons;
