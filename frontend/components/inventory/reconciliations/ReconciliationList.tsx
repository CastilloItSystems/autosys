"use client";

import { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";
import { motion } from "framer-motion";
import { useEmpresasStore } from "@/store/empresasStore";

import reconciliationService from "../../../app/api/inventory/reconciliationService";
import {
  Reconciliation,
  ReconciliationStatus,
  ReconciliationSource,
} from "../../../app/api/inventory/reconciliationService";
import warehouseService, {
  Warehouse,
} from "../../../app/api/inventory/warehouseService";
import {
  RECONCILIATION_STATUS_CONFIG,
  RECONCILIATION_SOURCE_CONFIG,
} from "../../../libs/interfaces/inventory/reconciliation.interface";
import ReconciliationForm from "./ReconciliationForm";
import ReconciliationDetail from "./ReconciliationDetail";

export default function ReconciliationList() {
  const { activeEmpresa } = useEmpresasStore();
  const toast = useRef<Toast>(null);

  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    status?: ReconciliationStatus | null;
    warehouseId?: string | null;
    source?: ReconciliationSource | null;
    page: number;
    limit: number;
  }>({ page: 1, limit: 20 });

  const [selectedReconciliation, setSelectedReconciliation] =
    useState<Reconciliation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // ── Carga inicial de almacenes ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const response = await warehouseService.getActive();
        setWarehouses(Array.isArray(response.data) ? response.data : []);
      } catch {
        // silencioso
      }
    })();
  }, []);

  // ── Carga de reconciliaciones ────────────────────────────────────────────
  useEffect(() => {
    if (activeEmpresa) loadReconciliations();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.warehouseId,
    filters.source,
    activeEmpresa?.id_empresa,
  ]);

  const loadReconciliations = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      if (filters.source) params.source = filters.source;

      const response = await reconciliationService.getAll(
        filters.page,
        filters.limit,
        params,
      );
      setReconciliations(Array.isArray(response.data) ? response.data : []);
      setTotalRecords(response.pagination?.total ?? 0);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message || "Error al cargar reconciliaciones",
        life: 3000,
      });
      setReconciliations([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Acciones de flujo ────────────────────────────────────────────────────
  const performAction = (
    reconciliation: Reconciliation,
    action: "start" | "complete" | "approve" | "apply" | "reject" | "cancel",
    label: string,
    icon: string,
    acceptClass: string,
  ) => {
    confirmDialog({
      message: `¿Confirma ${label} la reconciliación ${reconciliation.reconciliationNumber}?`,
      header: `Confirmar acción`,
      icon,
      acceptClassName: acceptClass,
      acceptLabel: label.charAt(0).toUpperCase() + label.slice(1),
      rejectLabel: "Volver",
      accept: async () => {
        try {
          switch (action) {
            case "start":
              await reconciliationService.start(reconciliation.id, "SYSTEM");
              break;
            case "complete":
              await reconciliationService.complete(reconciliation.id, "SYSTEM");
              break;
            case "approve":
              await reconciliationService.approve(reconciliation.id, "SYSTEM");
              break;
            case "apply":
              await reconciliationService.apply(reconciliation.id, "SYSTEM");
              break;
            case "reject":
              await reconciliationService.reject(
                reconciliation.id,
                "Rechazado por usuario",
              );
              break;
            case "cancel":
              await reconciliationService.cancel(reconciliation.id);
              break;
          }
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Reconciliación ${label} correctamente`,
            life: 3000,
          });
          loadReconciliations();
        } catch (err: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.message ?? `Error al ${label}`,
            life: 4000,
          });
        }
      },
    });
  };

  // ── Templates ────────────────────────────────────────────────────────────
  const statusTemplate = (rowData: Reconciliation) => {
    const cfg = RECONCILIATION_STATUS_CONFIG[rowData.status];
    return (
      <Tag value={cfg.label} severity={cfg.severity as any} icon={cfg.icon} />
    );
  };

  const sourceTemplate = (rowData: Reconciliation) => {
    if (!rowData.source) return <span className="text-500">—</span>;
    const cfg = RECONCILIATION_SOURCE_CONFIG[rowData.source];
    return (
      <div className="flex align-items-center gap-2">
        <i className={`${cfg.icon} text-500`} />
        <span>{cfg.label}</span>
      </div>
    );
  };

  const actionTemplate = (rowData: Reconciliation) => (
    <div className="flex align-items-center gap-1">
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        size="small"
        tooltip="Ver detalles"
        tooltipOptions={{ position: "top" }}
        onClick={() => {
          setSelectedReconciliation(rowData);
          setShowDetail(true);
        }}
      />
      {rowData.status === ReconciliationStatus.DRAFT && (
        <Button
          icon="pi pi-play"
          rounded
          text
          severity="success"
          size="small"
          tooltip="Iniciar"
          tooltipOptions={{ position: "top" }}
          onClick={() =>
            performAction(
              rowData,
              "start",
              "iniciada",
              "pi pi-play",
              "p-button-success",
            )
          }
        />
      )}
      {rowData.status === ReconciliationStatus.IN_PROGRESS && (
        <Button
          icon="pi pi-check"
          rounded
          text
          severity="success"
          size="small"
          tooltip="Completar"
          tooltipOptions={{ position: "top" }}
          onClick={() =>
            performAction(
              rowData,
              "complete",
              "completada",
              "pi pi-check",
              "p-button-success",
            )
          }
        />
      )}
      {rowData.status === ReconciliationStatus.COMPLETED && (
        <>
          <Button
            icon="pi pi-thumbs-up"
            rounded
            text
            severity="success"
            size="small"
            tooltip="Aprobar"
            tooltipOptions={{ position: "top" }}
            onClick={() =>
              performAction(
                rowData,
                "approve",
                "aprobada",
                "pi pi-thumbs-up",
                "p-button-success",
              )
            }
          />
          <Button
            icon="pi pi-thumbs-down"
            rounded
            text
            severity="warning"
            size="small"
            tooltip="Rechazar"
            tooltipOptions={{ position: "top" }}
            onClick={() =>
              performAction(
                rowData,
                "reject",
                "rechazada",
                "pi pi-exclamation-triangle",
                "p-button-warning",
              )
            }
          />
        </>
      )}
      {rowData.status === ReconciliationStatus.APPROVED && (
        <Button
          icon="pi pi-arrow-right"
          rounded
          text
          severity="success"
          size="small"
          tooltip="Aplicar cambios al stock"
          tooltipOptions={{ position: "top" }}
          onClick={() =>
            performAction(
              rowData,
              "apply",
              "aplicada",
              "pi pi-bolt",
              "p-button-success",
            )
          }
        />
      )}
      {[
        ReconciliationStatus.DRAFT,
        ReconciliationStatus.IN_PROGRESS,
        ReconciliationStatus.COMPLETED,
      ].includes(rowData.status) && (
        <Button
          icon="pi pi-ban"
          rounded
          text
          severity="danger"
          size="small"
          tooltip="Cancelar"
          tooltipOptions={{ position: "top" }}
          onClick={() =>
            performAction(
              rowData,
              "cancel",
              "cancelada",
              "pi pi-exclamation-triangle",
              "p-button-danger",
            )
          }
        />
      )}
    </div>
  );

  // ── Opciones de filtros ──────────────────────────────────────────────────
  const statusOptions = [
    { label: "Todos los estados", value: null },
    ...Object.entries(RECONCILIATION_STATUS_CONFIG).map(([key, cfg]) => ({
      label: cfg.label,
      value: key,
    })),
  ];

  const warehouseOptions = [
    { label: "Todos los almacenes", value: null },
    ...warehouses.map((w) => ({ label: w.name, value: w.id })),
  ];

  const sourceOptions = [
    { label: "Todos los orígenes", value: null },
    ...Object.entries(RECONCILIATION_SOURCE_CONFIG).map(([key, cfg]) => ({
      label: cfg.label,
      value: key,
    })),
  ];

  // ── Header del DataTable ─────────────────────────────────────────────────
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Reconciliaciones</h4>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          options={statusOptions}
          value={filters.status ?? null}
          onChange={(e) => setFilters({ ...filters, status: e.value, page: 1 })}
          placeholder="Todos los estados"
          className="w-14rem"
          showClear={!!filters.status}
        />
        <Dropdown
          options={warehouseOptions}
          value={filters.warehouseId ?? null}
          onChange={(e) =>
            setFilters({ ...filters, warehouseId: e.value, page: 1 })
          }
          placeholder="Todos los almacenes"
          className="w-14rem"
          showClear={!!filters.warehouseId}
        />
        <Dropdown
          options={sourceOptions}
          value={filters.source ?? null}
          onChange={(e) => setFilters({ ...filters, source: e.value, page: 1 })}
          placeholder="Todos los orígenes"
          className="w-14rem"
          showClear={!!filters.source}
        />
        <Button
          label="Nueva Reconciliación"
          icon="pi pi-plus"
          disabled={!activeEmpresa}
          onClick={() => {
            setSelectedReconciliation(null);
            setShowForm(true);
          }}
        />
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      {!activeEmpresa && (
        <Message
          severity="warn"
          className="w-full mb-3"
          text="Selecciona una empresa desde el menú superior para ver las reconciliaciones."
        />
      )}

      <div className="card">
        <DataTable
          value={reconciliations}
          loading={loading}
          paginator
          rows={filters.limit}
          first={(filters.page - 1) * filters.limit}
          totalRecords={totalRecords}
          onPage={(e) =>
            setFilters({ ...filters, page: e.page + 1, limit: e.rows })
          }
          rowsPerPageOptions={[10, 20, 50]}
          dataKey="id"
          stripedRows
          scrollable
          header={header}
          emptyMessage="No se encontraron reconciliaciones."
          size="small"
        >
          <Column body={actionTemplate} style={{ minWidth: "200px" }} />
          <Column
            field="reconciliationNumber"
            header="# Reconciliación"
            sortable
            style={{ minWidth: "160px" }}
          />
          <Column
            field="warehouse.name"
            header="Almacén"
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Origen"
            body={sourceTemplate}
            style={{ minWidth: "170px" }}
          />
          <Column
            header="Ítems"
            style={{ minWidth: "80px" }}
            body={(r: Reconciliation) => r.items?.length ?? 0}
          />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Creado"
            field="createdAt"
            sortable
            style={{ minWidth: "120px" }}
            body={(r: Reconciliation) =>
              new Date(r.createdAt).toLocaleDateString("es-VE")
            }
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedReconciliation(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-file-edit text-primary text-2xl" />
            <span className="text-xl font-semibold">
              {selectedReconciliation
                ? "Editar Reconciliación"
                : "Nueva Reconciliación"}
            </span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "860px" }}
      >
        <ReconciliationForm
          reconciliation={selectedReconciliation ?? undefined}
          warehouses={warehouses}
          onSuccess={() => {
            setShowForm(false);
            setSelectedReconciliation(null);
            loadReconciliations();
          }}
          onCancel={() => {
            setShowForm(false);
            setSelectedReconciliation(null);
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={showDetail}
        onHide={() => {
          setShowDetail(false);
          setSelectedReconciliation(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-info-circle text-primary text-2xl" />
            <span className="text-xl font-semibold">
              Reconciliación {selectedReconciliation?.reconciliationNumber}
            </span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "1000px" }}
      >
        {selectedReconciliation && (
          <ReconciliationDetail
            reconciliation={selectedReconciliation}
            onRefresh={() => {
              setShowDetail(false);
              loadReconciliations();
            }}
          />
        )}
      </Dialog>
    </motion.div>
  );
}
