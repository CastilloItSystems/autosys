"use client";

import React, { useState, useRef, useEffect } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";

import {
  getReconciliations,
  startReconciliation,
  completeReconciliation,
  approveReconciliation,
  applyReconciliation,
  rejectReconciliation,
  cancelReconciliation,
  Reconciliation,
  ReconciliationStatus,
  ReconciliationSource,
} from "../../../app/api/inventory/reconciliationService";
import {
  getActiveWarehouses,
  Warehouse,
} from "../../../app/api/inventory/warehouseService";
import {
  RECONCILIATION_STATUS_CONFIG,
  RECONCILIATION_SOURCE_CONFIG,
  CreateAllowedRoles,
} from "../../../libs/interfaces/inventory/reconciliation.interface";
import ReconciliationForm from "./ReconciliationForm";
import ReconciliationDetail from "./ReconciliationDetail";
import { useSession } from "next-auth/react";

export default function ReconciliationList() {
  const { data: session } = useSession();
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedReconciliation, setSelectedReconciliation] =
    useState<Reconciliation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | null>(
    null,
  );
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<ReconciliationSource | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useRef<Toast>(null);

  const canCreate = session?.user?.rol
    ? Object.values(CreateAllowedRoles).includes(
        session.user.rol as CreateAllowedRoles,
      )
    : false;

  useEffect(() => {
    (async () => {
      try {
        const response = await getActiveWarehouses();
        setWarehouses(response.data || []);
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar almacenes",
          life: 3000,
        });
      }
    })();
  }, []);

  useEffect(() => {
    loadReconciliations();
  }, [page, rows, statusFilter, warehouseFilter, sourceFilter, searchQuery]);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (statusFilter) filters.status = statusFilter;
      if (warehouseFilter) filters.warehouseId = warehouseFilter;
      if (sourceFilter) filters.source = sourceFilter;
      if (searchQuery) filters.search = searchQuery;

      const response = await getReconciliations(page + 1, rows, filters);

      const data = response.data || [];
      const total = response.pagination?.total || 0;

      setReconciliations(Array.isArray(data) ? data : []);
      setTotalRecords(total);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar reconciliaciones",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (
    reconciliationId: string,
    action: "start" | "complete" | "approve" | "apply" | "reject" | "cancel",
    actionLabel: string,
  ) => {
    confirmDialog({
      message: `¿Confirma ${actionLabel}?`,
      header: `Confirmar ${actionLabel}`,
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const userId = session?.user?.id || "SYSTEM";
          switch (action) {
            case "start":
              await startReconciliation(reconciliationId, userId);
              break;
            case "complete":
              await completeReconciliation(reconciliationId, userId);
              break;
            case "approve":
              await approveReconciliation(reconciliationId, userId);
              break;
            case "apply":
              await applyReconciliation(reconciliationId, userId);
              break;
            case "reject":
              await rejectReconciliation(
                reconciliationId,
                "Rechazado por usuario",
              );
              break;
            case "cancel":
              await cancelReconciliation(reconciliationId);
              break;
          }
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Reconciliación ${actionLabel}`,
            life: 3000,
          });
          loadReconciliations();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: `Error al ${actionLabel}`,
            life: 3000,
          });
        }
      },
    });
  };

  const statusTemplate = (rowData: Reconciliation) => {
    const config = RECONCILIATION_STATUS_CONFIG[rowData.status];
    return (
      <Badge
        value={config.label}
        severity={config.severity}
        className="text-xs"
      />
    );
  };

  const sourceTemplate = (rowData: Reconciliation) => {
    const config = rowData.source
      ? RECONCILIATION_SOURCE_CONFIG[rowData.source]
      : undefined;
    return <span>{config?.label || "N/A"}</span>;
  };

  const actionsTemplate = (rowData: Reconciliation) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          outlined
          severity="info"
          size="small"
          onClick={() => {
            setSelectedReconciliation(rowData);
            setShowDetail(true);
          }}
          tooltip="Ver detalles"
        />
        {rowData.status === ReconciliationStatus.DRAFT && (
          <Button
            icon="pi pi-play"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "start", "iniciada")}
            tooltip="Iniciar"
          />
        )}
        {rowData.status === ReconciliationStatus.IN_PROGRESS && (
          <Button
            icon="pi pi-check"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "complete", "completada")}
            tooltip="Completar"
          />
        )}
        {rowData.status === ReconciliationStatus.COMPLETED && (
          <Button
            icon="pi pi-check-circle"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "approve", "aprobada")}
            tooltip="Aprobar"
          />
        )}
        {rowData.status === ReconciliationStatus.APPROVED && (
          <Button
            icon="pi pi-arrow-right"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "apply", "aplicada")}
            tooltip="Aplicar cambios"
          />
        )}
        {[ReconciliationStatus.DRAFT, ReconciliationStatus.COMPLETED].includes(
          rowData.status,
        ) && (
          <Button
            icon="pi pi-times"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => performAction(rowData.id, "cancel", "cancelada")}
            tooltip="Cancelar"
          />
        )}
      </div>
    );
  };

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  const statusOptions = Object.entries(RECONCILIATION_STATUS_CONFIG).map(
    ([key, config]) => ({
      label: config.label,
      value: key,
    }),
  );

  const sourceOptions = Object.entries(RECONCILIATION_SOURCE_CONFIG).map(
    ([key, config]) => ({
      label: config.label,
      value: key,
    }),
  );

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Reconciliaciones</h1>
          {canCreate && (
            <Button
              label="Nueva Reconciliación"
              icon="pi pi-plus"
              onClick={() => {
                setSelectedReconciliation(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <InputText
            placeholder="Buscar por número..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full"
          />

          <Dropdown
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.value);
              setPage(0);
            }}
            showClear
            className="w-full"
          />

          <Dropdown
            options={warehouseOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por almacén"
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.value);
              setPage(0);
            }}
            showClear
            className="w-full"
          />

          <Dropdown
            options={sourceOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por origen"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.value);
              setPage(0);
            }}
            showClear
            className="w-full"
          />
        </div>
      </div>

      <DataTable
        value={reconciliations}
        lazy
        paginator
        rows={rows}
        totalRecords={totalRecords}
        onPage={(e) => {
          setPage(e.first! / e.rows!);
          setRows(e.rows!);
        }}
        loading={loading}
        className="w-full"
        stripedRows
        showGridlines
        responsiveLayout="scroll"
      >
        <Column
          field="reconciliationNumber"
          header="# Reconciliación"
          sortable
          style={{ width: "140px" }}
        />
        <Column
          field="warehouse.name"
          header="Almacén"
          style={{ width: "120px" }}
        />
        <Column
          field="source"
          header="Origen"
          body={sourceTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="itemsCount"
          header="Items"
          style={{ width: "80px" }}
          body={(rowData: Reconciliation) => (
            <span>{rowData.items?.length || 0}</span>
          )}
        />
        <Column
          field="status"
          header="Estado"
          body={statusTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="createdAt"
          header="Fecha"
          body={(rowData: Reconciliation) => (
            <>{new Date(rowData.createdAt).toLocaleDateString()}</>
          )}
          style={{ width: "100px" }}
        />
        <Column
          header="Acciones"
          body={actionsTemplate}
          style={{ width: "250px" }}
        />
      </DataTable>

      <Dialog
        header="Nueva Reconciliación"
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedReconciliation(null);
        }}
        modal
        style={{ width: "90vw", maxWidth: "850px" }}
      >
        <ReconciliationForm
          reconciliation={selectedReconciliation || undefined}
          warehouses={warehouses}
          onSuccess={() => {
            setShowForm(false);
            setSelectedReconciliation(null);
            loadReconciliations();
          }}
        />
      </Dialog>

      <Dialog
        header="Detalles de Reconciliación"
        visible={showDetail}
        onHide={() => {
          setShowDetail(false);
          setSelectedReconciliation(null);
        }}
        modal
        style={{ width: "90vw", maxWidth: "1000px" }}
      >
        {selectedReconciliation && (
          <ReconciliationDetail reconciliation={selectedReconciliation} />
        )}
      </Dialog>
    </motion.div>
  );
}
