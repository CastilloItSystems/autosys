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
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import adjustmentService, {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_STATUS_SEVERITY,
  Adjustment,
  AdjustmentStatus,
} from "@/app/api/inventory/adjustmentService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import AdjustmentForm from "@/components/inventory/adjustments/AdjustmentForm";
import AdjustmentDetail from "@/components/inventory/adjustments/AdjustmentDetail";

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
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  console.log(adjustments);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<Adjustment | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterStatus, setFilterStatus] = useState<AdjustmentStatus | null>(
    null,
  );
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);

  const toast = useRef<Toast | null>(null);

  // Fetch data on mount and when filters/pagination change
  useEffect(() => {
    fetchAdjustments();
  }, [
    page,
    limit,
    filterStatus,
    filterWarehouse,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const response = await adjustmentService.getAll({
        page,
        limit,
        status: filterStatus || undefined,
        warehouseId: filterWarehouse || undefined,
        dateFrom: filterDateFrom
          ? filterDateFrom.toISOString().split("T")[0]
          : undefined,
        dateTo: filterDateTo
          ? filterDateTo.toISOString().split("T")[0]
          : undefined,
      });
      console.log(response);
      setAdjustments(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      console.error("Error fetching adjustments:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los ajustes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses on mount
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
    setPage((event.first ?? 0) / (event.rows ?? 20) + 1);
    setLimit(event.rows ?? 20);
  };

  const hideFormDialog = () => setFormDialog(false);

  const onFormSuccess = () => {
    hideFormDialog();
    setPage(1);
    fetchAdjustments();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Ajuste creado exitosamente",
      life: 3000,
    });
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
    return new Date(rowData.createdAt).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData: Adjustment) => {
    const isApproved = rowData.status === "APPROVED";
    const isDraft = rowData.status === "DRAFT";

    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          size="small"
          tooltip="Ver detalles"
          onClick={async () => {
            try {
              const resp = await adjustmentService.getById(rowData.id);
              setSelectedAdjustment(resp.data);
              setDetailDialog(true);
            } catch (error) {
              console.error("Error fetching adjustment details", error);
              toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo cargar detalle",
              });
            }
          }}
        />
        {isDraft && (
          <Button
            icon="pi pi-check"
            rounded
            severity="success"
            size="small"
            tooltip="Aprobar"
            onClick={() => handleApprove(rowData)}
          />
        )}
        {isApproved && (
          <Button
            icon="pi pi-arrow-right"
            rounded
            severity="info"
            size="small"
            tooltip="Aplicar"
            onClick={() => handleApply(rowData)}
          />
        )}
        {(isDraft || isApproved) && (
          <Button
            icon="pi pi-times"
            rounded
            severity="danger"
            size="small"
            tooltip="Rechazar"
            onClick={() => handleReject(rowData)}
          />
        )}
        {(isDraft || isApproved) && (
          <Button
            icon="pi pi-ban"
            rounded
            severity="warning"
            size="small"
            tooltip="Cancelar"
            onClick={() => handleCancel(rowData)}
          />
        )}
      </div>
    );
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
          fetchAdjustments();
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
          fetchAdjustments();
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
          fetchAdjustments();
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
          fetchAdjustments();
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

  const renderFilters = () => (
    <div className="grid gap-3 mb-4">
      <div className="flex flex-wrap gap-3 align-items-end">
        <div className="flex-grow-1" style={{ minWidth: "200px" }}>
          <label className="block text-sm font-semibold mb-2">Estado</label>
          <Dropdown
            value={filterStatus}
            onChange={(e: DropdownChangeEvent) => {
              setFilterStatus(e.value);
              setPage(1);
            }}
            options={ADJUSTMENT_STATUSES}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            className="w-full"
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "200px" }}>
          <label className="block text-sm font-semibold mb-2">Almacén</label>
          <Dropdown
            value={filterWarehouse}
            onChange={(e: DropdownChangeEvent) => {
              setFilterWarehouse(e.value);
              setPage(1);
            }}
            options={warehouses}
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar almacén"
            className="w-full"
            showClear
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "180px" }}>
          <label className="block text-sm font-semibold mb-2">Desde</label>
          <Calendar
            value={filterDateFrom}
            onChange={(e) => {
              setFilterDateFrom(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            showIcon
            className="w-full"
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "180px" }}>
          <label className="block text-sm font-semibold mb-2">Hasta</label>
          <Calendar
            value={filterDateTo}
            onChange={(e) => {
              setFilterDateTo(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            showIcon
            className="w-full"
          />
        </div>

        <Button
          label="Crear Ajuste"
          icon="pi pi-plus"
          onClick={() => setFormDialog(true)}
          className="p-button-success"
        />
      </div>
    </div>
  );

  if (loading && adjustments.length === 0) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        {renderFilters()}

        <DataTable
          value={adjustments}
          paginator
          lazy
          first={(page - 1) * limit}
          rows={limit}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          loading={loading}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ajustes"
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No hay ajustes disponibles"
          size="small"
        >
          <Column
            field="adjustmentNumber"
            header="# Ajuste"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Almacén"
            body={warehouseBodyTemplate}
            style={{ width: "150px" }}
          />
          <Column
            header="Motivo"
            body={reasonBodyTemplate}
            style={{ width: "200px" }}
          />
          <Column
            field="createdBy"
            header="Solicitante"
            style={{ width: "120px" }}
          />
          <Column
            field="createdAt"
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            style={{ width: "150px" }}
          />
        </DataTable>

        <ConfirmDialog />

        <Dialog
          visible={detailDialog}
          style={{ width: "900px" }}
          header="Detalle de Ajuste"
          modal
          onHide={hideDetailDialog}
        >
          {selectedAdjustment ? (
            // Lazy load component
            <>
              {/* Dynamic import avoided; component is small and local */}
              <AdjustmentDetail adjustment={selectedAdjustment} />
            </>
          ) : (
            <div className="flex justify-content-center">
              <ProgressSpinner />
            </div>
          )}
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header="Crear Ajuste de Inventario"
          modal
          onHide={hideFormDialog}
        >
          <AdjustmentForm
            onSave={onFormSuccess}
            onCancel={hideFormDialog}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default AdjustmentList;
