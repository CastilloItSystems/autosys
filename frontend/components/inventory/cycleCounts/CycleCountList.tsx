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
import { Calendar } from "primereact/calendar";

import cycleCountService, {
  CycleCount,
  CycleCountStatus,
} from "../../../app/api/inventory/cycleCountService";
import warehouseService, {
  Warehouse,
} from "../../../app/api/inventory/warehouseService";
import {
  CYCLE_COUNT_STATUS_CONFIG,
  CycleCountCreateAllowedRoles,
} from "../../../libs/interfaces/inventory/cycleCount.interface";
import CycleCountForm from "./CycleCountForm";
import CycleCountDetail from "./CycleCountDetail";
import FormActionButtons from "../../common/FormActionButtons";
import { useSession } from "next-auth/react";

export default function CycleCountList() {
  const { data: session } = useSession();
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedCycleCount, setSelectedCycleCount] =
    useState<CycleCount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<CycleCountStatus | null>(
    null,
  );
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useRef<Toast>(null);

  const canCreate = true;
  /* session?.user?.rol
    ? Object.values(CycleCountCreateAllowedRoles).includes(
        session.user.rol as CycleCountCreateAllowedRoles,
      )
    : false; */

  useEffect(() => {
    (async () => {
      try {
        const response = await warehouseService.getActive();
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
    loadCycleCounts();
  }, [page, rows, statusFilter, warehouseFilter, searchQuery]);

  const loadCycleCounts = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (statusFilter) filters.status = statusFilter;
      if (warehouseFilter) filters.warehouseId = warehouseFilter;
      if (searchQuery) filters.search = searchQuery;

      const response = await cycleCountService.getAll({
        page: page + 1,
        limit: rows,
        ...filters,
      });

      const data = response.data || [];
      const total = response.meta?.total || 0;

      setCycleCounts(Array.isArray(data) ? data : []);
      setTotalRecords(total);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar conteos cíclicos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (
    cycleCountId: string,
    action: "start" | "complete" | "approve" | "apply" | "reject" | "cancel",
    actionLabel: string,
  ) => {
    let message = `¿Confirma ${actionLabel}?`;
    let header = `Confirmar ${actionLabel}`;
    let icon = "pi pi-exclamation-triangle";
    let acceptClassName = "";

    // Verificar varianza alta antes de aprobar
    if (action === "approve") {
      try {
        const fullData = await cycleCountService.getById(cycleCountId);
        // @ts-ignore
        const cycleCount = fullData.data || fullData;

        const hasHighVariance = cycleCount.items?.some((item: any) => {
          const diff = Math.abs(
            (item.countedQuantity ?? 0) - item.expectedQuantity,
          );
          return diff > 5;
        });

        if (hasHighVariance) {
          header = "⚠️ ALERTA: Alta Varianza Detectada";
          message =
            "Este conteo tiene diferencias mayores a 5 unidades. Se requiere rol de Supervisor (ADMIN/GERENTE) para aprobar. ¿Desea continuar?";
          icon = "pi pi-exclamation-triangle text-red-500 text-xl";
          acceptClassName = "p-button-danger";
        }
      } catch (e) {
        console.error("Error verificando varianza", e);
      }
    }

    confirmDialog({
      message,
      header,
      icon,
      acceptClassName,
      accept: async () => {
        try {
          const userId = session?.user?.id || "SYSTEM";
          switch (action) {
            case "start":
              await cycleCountService.start(cycleCountId, userId);
              break;
            case "complete":
              await cycleCountService.complete(cycleCountId, userId);
              break;
            case "approve":
              await cycleCountService.approve(cycleCountId, userId);
              break;
            case "apply":
              await cycleCountService.apply(cycleCountId, userId);
              break;
            case "reject":
              await cycleCountService.reject(
                cycleCountId,
                "Rechazado por usuario",
              );
              break;
            case "cancel":
              await cycleCountService.cancel(cycleCountId);
              break;
          }
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Conteo ${actionLabel} exitosamente`,
            life: 3000,
          });
          loadCycleCounts();
        } catch (error: any) {
          // Mostrar mensaje de error específico si viene del backend (ej. Forbidden)
          const errorMsg =
            error.response?.data?.message || `Error al ${actionLabel}`;
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: errorMsg,
            life: 5000,
          });
        }
      },
    });
  };

  const statusTemplate = (rowData: CycleCount) => {
    const config = CYCLE_COUNT_STATUS_CONFIG[rowData.status];
    return (
      <Badge
        value={config.label}
        severity={config.severity}
        className="text-xs"
      />
    );
  };

  const actionsTemplate = (rowData: CycleCount) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={
            rowData.status === CycleCountStatus.IN_PROGRESS
              ? "pi pi-list-check"
              : "pi pi-eye"
          }
          rounded
          outlined
          severity={
            rowData.status === CycleCountStatus.IN_PROGRESS ? "success" : "info"
          }
          size="small"
          onClick={async () => {
            setSelectedCycleCount(rowData);
            setShowDetail(true);
            try {
              const fullData = await cycleCountService.getById(rowData.id);
              // @ts-ignore
              const cycleCountData = fullData.data || fullData;
              setSelectedCycleCount(cycleCountData);
            } catch (error) {
              console.error("Error fetching full details", error);
            }
          }}
          tooltip={
            rowData.status === CycleCountStatus.IN_PROGRESS
              ? "Cargar Conteo"
              : "Ver Detalles"
          }
        />
        {rowData.status === CycleCountStatus.DRAFT && (
          <>
            <Button
              icon="pi pi-pencil"
              rounded
              outlined
              severity="warning"
              size="small"
              onClick={() => {
                setSelectedCycleCount(rowData);
                setShowForm(true);
              }}
              tooltip="Editar borrador"
            />
            <Button
              icon="pi pi-play"
              rounded
              outlined
              severity="success"
              size="small"
              onClick={() => performAction(rowData.id, "start", "iniciado")}
              tooltip="Iniciar conteo"
            />
          </>
        )}
        {rowData.status === CycleCountStatus.IN_PROGRESS && (
          <Button
            icon="pi pi-check"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "complete", "completado")}
            tooltip="Completar conteo"
          />
        )}
        {rowData.status === CycleCountStatus.COMPLETED && (
          <Button
            icon="pi pi-check-circle"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "approve", "aprobado")}
            tooltip="Aprobar conteo"
          />
        )}
        {rowData.status === CycleCountStatus.APPROVED && (
          <Button
            icon="pi pi-arrow-right"
            rounded
            outlined
            severity="success"
            size="small"
            onClick={() => performAction(rowData.id, "apply", "aplicado")}
            tooltip="Aplicar cambios"
          />
        )}
        {[
          CycleCountStatus.DRAFT,
          CycleCountStatus.COMPLETED,
          CycleCountStatus.APPROVED,
        ].includes(rowData.status) && (
          <Button
            icon="pi pi-times"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => performAction(rowData.id, "cancel", "cancelado")}
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

  const statusOptions = Object.entries(CYCLE_COUNT_STATUS_CONFIG).map(
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

      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">Conteos Cíclicos</h1>
          <p className="text-500 m-0 text-sm">
            Auditoría y corrección de inventario
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              label="Nuevo Conteo"
              icon="pi pi-plus"
              onClick={() => {
                setSelectedCycleCount(null);
                setShowForm(true);
              }}
              severity="info"
            />
          )}
        </div>
      </div>

      <div className="card p-3 shadow-2 border-round mb-4">
        <div className="grid formgrid p-fluid">
          <div className="col-12 md:col-4">
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search" />
              <InputText
                placeholder="Buscar por número..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full"
              />
            </span>
          </div>

          <div className="col-12 md:col-4">
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
          </div>

          <div className="col-12 md:col-4">
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
          </div>
        </div>
      </div>

      <DataTable
        value={cycleCounts}
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
          field="cycleCountNumber"
          header="# Conteo"
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="warehouse.name"
          header="Almacén"
          style={{ width: "120px" }}
        />
        <Column
          field="itemsCount"
          header="Items"
          style={{ width: "80px" }}
          body={(rowData: CycleCount) => (
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
          body={(rowData: CycleCount) => (
            <>{new Date(rowData.createdAt).toLocaleDateString("es-ES")}</>
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
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedCycleCount(null);
        }}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-sync mr-3 text-primary text-3xl"></i>
                {selectedCycleCount
                  ? `Editar Borrador — ${selectedCycleCount.cycleCountNumber}`
                  : "Nuevo Conteo Cíclico"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="cycle-count-form"
            isUpdate={!!selectedCycleCount}
            submitLabel={
              selectedCycleCount ? "Actualizar Borrador" : "Crear Borrador"
            }
            onCancel={() => {
              setShowForm(false);
              setSelectedCycleCount(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <CycleCountForm
          cycleCount={selectedCycleCount || undefined}
          warehouses={warehouses}
          formId="cycle-count-form"
          toast={toast}
          onSave={() => {
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: selectedCycleCount
                ? "Conteo actualizado"
                : "Conteo creado",
              life: 3000,
            });
            setShowForm(false);
            setSelectedCycleCount(null);
            loadCycleCounts();
          }}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>

      <Dialog
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-sync mr-3 text-primary text-3xl"></i>
                {selectedCycleCount?.status === CycleCountStatus.IN_PROGRESS
                  ? `Cargar Conteo — ${selectedCycleCount.cycleCountNumber}`
                  : `Detalle — ${selectedCycleCount?.cycleCountNumber ?? ""}`}
              </h2>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-content-end">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => {
                setShowDetail(false);
                setSelectedCycleCount(null);
              }}
            />
          </div>
        }
        visible={showDetail}
        onHide={() => {
          setShowDetail(false);
          setSelectedCycleCount(null);
        }}
        modal
        maximizable
      >
        {selectedCycleCount && (
          <CycleCountDetail cycleCount={selectedCycleCount} />
        )}
      </Dialog>
    </motion.div>
  );
}
