"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const AdjustmentPDFPreview = dynamic(() => import("./AdjustmentPDFPreview"), { ssr: false });
import adjustmentService, {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_STATUS_SEVERITY,
  Adjustment,
  AdjustmentStatus,
} from "@/modules/inventory/adjustments/services/adjustmentService";
import warehouseService, {
  Warehouse,
} from "@/modules/inventory/warehouses/services/warehouseService";
import AdjustmentForm from "@/modules/inventory/adjustments/components/AdjustmentForm";
import AdjustmentDetail from "@/modules/inventory/adjustments/components/AdjustmentDetail";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/shared/components/FormActionButtons";
import { useAdjustmentsData } from "@/modules/inventory/adjustments/hooks/useAdjustmentsData";

const ADJUSTMENT_STATUSES: { label: string; value: AdjustmentStatus | null }[] =
  [
    { label: "Todos", value: null },
    { label: "Borrador", value: "DRAFT" },
    { label: "Aprobado", value: "APPROVED" },
    { label: "Aplicado", value: "APPLIED" },
    { label: "Rechazado", value: "REJECTED" },
    { label: "Cancelado", value: "CANCELLED" },
  ];

const AdjustmentList = () => {
  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formDialog, setFormDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<Adjustment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination (backend espera page 1-based)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [filterStatus, setFilterStatus] = useState<AdjustmentStatus | null>(
    null,
  );
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Action menu
  const menuRef = useRef<Menu>(null);
  const [actionItem, setActionItem] = useState<Adjustment | null>(null);
  const [pdfItem, setPdfItem] = useState<Adjustment | null>(null);

  const toast = useRef<Toast | null>(null);

  const { adjustments, total: totalRecords, loading, mutate } = useAdjustmentsData({
    page,
    limit,
    status: filterStatus || undefined,
    warehouseId: filterWarehouse || undefined,
    search: searchQuery || undefined,
    dateFrom: filterDateFrom
      ? filterDateFrom.toISOString().split("T")[0]
      : undefined,
    dateTo: filterDateTo
      ? filterDateTo.toISOString().split("T")[0]
      : undefined,
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getActive();
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  // Handlers
  const handlePageChange = (event: DataTablePageEvent) => {
    setPage((event.first ?? 0) / (event.rows ?? 10) + 1);
    setLimit(event.rows ?? 10);
  };

  const openNew = () => {
    setFormDialog(true);
  };

  const hideFormDialog = () => setFormDialog(false);

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Ajuste creado correctamente",
      life: 3000,
    });
    setFormDialog(false);
    setPage(1);
    mutate();
  };

  const viewDetails = async (adjustment: Adjustment) => {
    try {
      const resp = await adjustmentService.getById(adjustment.id);
      setSelectedAdjustment(resp.data);
      setDetailDialog(true);
    } catch (error) {
      console.error("Error fetching adjustment details", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar detalle",
        life: 3000,
      });
    }
  };

  const hideDetailDialog = () => {
    setDetailDialog(false);
    setSelectedAdjustment(null);
  };

  const handleApprove = (adjustment: Adjustment) => {
    confirmDialog({
      message: `¿Confirma aprobación del ajuste ${adjustment.adjustmentNumber}?`,
      header: "Confirmar Aprobación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await adjustmentService.approve(adjustment.id);
          mutate();
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ajuste aprobado",
            life: 3000,
          });
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al aprobar ajuste",
            life: 3000,
          });
        }
      },
    });
  };

  const handleApply = (adjustment: Adjustment) => {
    confirmDialog({
      message: `¿Confirma aplicación del ajuste ${adjustment.adjustmentNumber}?`,
      header: "Confirmar Aplicación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await adjustmentService.apply(adjustment.id);
          mutate();
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ajuste aplicado",
            life: 3000,
          });
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al aplicar ajuste",
            life: 3000,
          });
        }
      },
    });
  };

  const handleReject = (adjustment: Adjustment) => {
    confirmDialog({
      message: `¿Confirma rechazo del ajuste ${adjustment.adjustmentNumber}?`,
      header: "Confirmar Rechazo",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await adjustmentService.reject(adjustment.id);
          mutate();
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ajuste rechazado",
            life: 3000,
          });
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al rechazar ajuste",
            life: 3000,
          });
        }
      },
    });
  };

  const handleCancel = (adjustment: Adjustment) => {
    confirmDialog({
      message: `¿Confirma cancelación del ajuste ${adjustment.adjustmentNumber}?`,
      header: "Confirmar Cancelación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await adjustmentService.cancel(adjustment.id);
          mutate();
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ajuste cancelado",
            life: 3000,
          });
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al cancelar ajuste",
            life: 3000,
          });
        }
      },
    });
  };

  // Menu items según el estado del ajuste
  const getMenuItems = (item: Adjustment | null): MenuItem[] => {
    if (!item) return [];
    const isDraft = item.status === "DRAFT";
    const isApproved = item.status === "APPROVED";

    const items: MenuItem[] = [
      {
        label: "Ver detalles",
        icon: "pi pi-eye",
        command: () => viewDetails(item),
      },
      {
        label: "Imprimir PDF",
        icon: "pi pi-print",
        command: () => setPdfItem(item),
      },
    ];

    if (isDraft) {
      items.push({
        label: "Aprobar",
        icon: "pi pi-check",
        command: () => handleApprove(item),
      });
    }

    if (isApproved) {
      items.push({
        label: "Aplicar",
        icon: "pi pi-arrow-right",
        command: () => handleApply(item),
      });
    }

    if (isDraft || isApproved) {
      items.push({ separator: true });
      items.push({
        label: "Rechazar",
        icon: "pi pi-times",
        className: "p-menuitem-danger",
        command: () => handleReject(item),
      });
      items.push({
        label: "Cancelar",
        icon: "pi pi-ban",
        className: "p-menuitem-danger",
        command: () => handleCancel(item),
      });
    }

    return items;
  };

  // Template functions
  const statusBodyTemplate = (rowData: Adjustment) => {
    const severity = ADJUSTMENT_STATUS_SEVERITY[rowData.status];
    const label = ADJUSTMENT_STATUS_LABELS[rowData.status];
    return <Tag value={label} severity={severity} />;
  };

  const warehouseBodyTemplate = (rowData: Adjustment) => {
    if (!rowData.warehouse) return <span className="text-500">-</span>;
    return (
      <div className="flex flex-column">
        <span className="font-semibold">{rowData.warehouse.name}</span>
        <span className="text-sm text-gray-500">{rowData.warehouse.code}</span>
      </div>
    );
  };

  const reasonBodyTemplate = (rowData: Adjustment) => (
    <span className="text-truncate" title={rowData.reason}>
      {rowData.reason}
    </span>
  );

  const dateBodyTemplate = (rowData: Adjustment) => {
    if (!rowData.createdAt) return "-";
    return new Date(rowData.createdAt).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData: Adjustment) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="adjustment-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Ajustes de Inventario</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={filterStatus}
          options={ADJUSTMENT_STATUSES}
          onChange={(e: DropdownChangeEvent) => {
            setFilterStatus(e.value);
            setPage(1);
          }}
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          style={{ minWidth: "150px" }}
        />
        <Dropdown
          value={filterWarehouse}
          options={warehouses}
          onChange={(e: DropdownChangeEvent) => {
            setFilterWarehouse(e.value);
            setPage(1);
          }}
          optionLabel="name"
          optionValue="id"
          placeholder="Almacén"
          style={{ minWidth: "160px" }}
          showClear
        />
        <Calendar
          value={filterDateFrom}
          onChange={(e) => {
            setFilterDateFrom(e.value || null);
            setPage(1);
          }}
          dateFormat="dd/mm/yy"
          placeholder="Desde"
          showIcon
          style={{ maxWidth: "160px" }}
        />
        <Calendar
          value={filterDateTo}
          onChange={(e) => {
            setFilterDateTo(e.value || null);
            setPage(1);
          }}
          dateFormat="dd/mm/yy"
          placeholder="Hasta"
          showIcon
          style={{ maxWidth: "160px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </span>
        <CreateButton
          label="Nuevo ajuste"
          onClick={openNew}
          tooltip="Crear ajuste de inventario"
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          value={adjustments}
          paginator
          lazy
          scrollable
          sortMode="multiple"
          first={(page - 1) * limit}
          rows={limit}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={handlePageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron ajustes"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ajustes"
          size="small"
        >
          <Column
            field="adjustmentNumber"
            header="# Ajuste"
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Almacén"
            body={warehouseBodyTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Motivo"
            body={reasonBodyTemplate}
            style={{ minWidth: "220px" }}
          />
          <Column
            field="createdBy"
            header="Solicitante"
            style={{ minWidth: "140px" }}
            body={(rowData: Adjustment) => rowData.createdByName ?? rowData.createdBy ?? "—"}
          />
          <Column
            field="createdAt"
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen={true}
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>

        <ConfirmDialog />

        <Menu
          model={getMenuItems(actionItem)}
          popup
          ref={menuRef}
          id="adjustment-menu"
        />

        <Dialog
          visible={detailDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
          modal
          maximizable
          onHide={hideDetailDialog}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-file-o mr-3 text-primary text-3xl"></i>
                  Detalle de Ajuste
                </h2>
              </div>
            </div>
          }
        >
          {selectedAdjustment && (
            <AdjustmentDetail adjustment={selectedAdjustment} />
          )}
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
          modal
          maximizable
          onHide={hideFormDialog}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-sliders-h mr-3 text-primary text-3xl"></i>
                  Nuevo Ajuste de Inventario
                </h2>
              </div>
            </div>
          }
          footer={
            <FormActionButtons
              formId="adjustment-form"
              isUpdate={false}
              onCancel={hideFormDialog}
              isSubmitting={isSubmitting}
              submitLabel="Crear Ajuste"
            />
          }
        >
          <AdjustmentForm
            formId="adjustment-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
          />
        </Dialog>

        {pdfItem && (
          <Dialog
            visible
            onHide={() => setPdfItem(null)}
            header="Vista Previa — Ajuste de Inventario"
            style={{ width: "85%", height: "90vh" }}
            contentStyle={{ padding: 0, height: "100%" }}
            modal
          >
            <AdjustmentPDFPreview data={pdfItem} />
          </Dialog>
        )}
      </motion.div>
    </>
  );
};

export default AdjustmentList;
