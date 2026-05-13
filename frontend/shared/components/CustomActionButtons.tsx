import React, { useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import PDFGenerator from "@/components/pdf/PDFGenerator";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  getPermissionGateForPath,
  type PermissionAction,
} from "@/lib/permissionGates";

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
  infoPermission?: string;
  editPermission?: string;
  deletePermission?: string;
  duplicatePermission?: string;
  pdfPermission?: string;
  viewPaymentsPermission?: string;
  addPaymentPermission?: string;
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
    infoPermission,
    editPermission,
    deletePermission,
    duplicatePermission,
    pdfPermission,
    viewPaymentsPermission,
    addPaymentPermission,
  } = props;
  const pathname = usePathname();
  const { canAccessGate } = useUserPermissions();
  const can = (action: PermissionAction, permission?: string) =>
    canAccessGate(
      permission ? { permission } : getPermissionGateForPath(pathname, action),
    );
  const canInfo = can("view", infoPermission);
  const canEdit = can("update", editPermission);
  const canDelete = can("delete", deletePermission);
  const canDuplicate = can("create", duplicatePermission);
  const canPdf = canAccessGate({ permission: pdfPermission ?? "reports.export" });
  const canViewPayments = canAccessGate({
    permission: viewPaymentsPermission ?? "payments.view",
  });
  const canAddPayment = canAccessGate({
    permission: addPaymentPermission ?? "payments.create",
  });

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

  const menuRef = useRef<any>(null);

  // Crear items del menú
  const menuItems = [];
  if (onInfo && canInfo) {
    menuItems.push({
      label: "Ver Historial",
      icon: "pi pi-info-circle",
      command: () => onInfo(rowData),
    });
  }
  if (onEdit && canEdit) {
    menuItems.push({
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => onEdit(rowData),
    });
  }
  if (onDelete && canDelete) {
    menuItems.push({
      label: "Eliminar",
      icon: "pi pi-trash",
      command: () => onDelete(rowData),
    });
  }
  if (onDuplicate && canDuplicate) {
    menuItems.push({
      label: "Copiar Información",
      icon: "pi pi-copy",
      command: () => onDuplicate(rowData),
    });
  }
  if (onViewPayments && canViewPayments) {
    menuItems.push({
      label: "Ver Pagos",
      icon: "pi pi-dollar",
      command: () => onViewPayments(rowData),
    });
  }
  if (onAddPayment && canAddPayment) {
    menuItems.push({
      label: "Agregar Pago",
      icon: "pi pi-plus",
      command: () => onAddPayment(rowData),
    });
  }
  if (Template && canPdf) {
    menuItems.push({
      label: pdfDownloadText,
      icon: "pi pi-file-pdf",
      command: () => {}, // El PDFGenerator se muestra oculto
    });
  }

  if (menuItems.length === 0) return null;

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
        {Template && canPdf && (
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
      {onInfo && canInfo && (
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
      {onEdit && canEdit && (
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
      {onDelete && canDelete && (
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
      {onDuplicate && canDuplicate && (
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
      {onViewPayments && canViewPayments && (
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
      {onAddPayment && canAddPayment && (
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
      {Template && canPdf && (
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
