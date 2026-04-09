"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { laborTimeService } from "@/app/api/workshop";
import type { LaborTime, LaborTimeStatus } from "@/libs/interfaces/workshop";
import {
  LaborTimeStatusBadge,
  LABOR_STATUS_LABELS,
} from "@/components/workshop/shared/LaborTimeStatusBadge";
import LaborTimeStartForm from "./LaborTimeStartForm";

interface LaborTimeListProps {
  serviceOrderId?: string;
  embedded?: boolean;
}

export default function LaborTimeList({
  serviceOrderId,
  embedded,
}: LaborTimeListProps) {
  const [items, setItems] = useState<LaborTime[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [actionItem, setActionItem] = useState<LaborTime | null>(null);

  const [serviceOrderFilter, setServiceOrderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LaborTimeStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [startDialog, setStartDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  // Use prop serviceOrderId when embedded, otherwise use state filter
  const finalServiceOrderId = embedded ? serviceOrderId : serviceOrderFilter;

  useEffect(() => {
    if (embedded && !serviceOrderId) return; // Wait for prop if embedded
    setPage(0); // Reset to page 1 when filter changes
    loadItems();
  }, [finalServiceOrderId, statusFilter, embedded]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await laborTimeService.getAll({
        page: page + 1,
        limit: rows,
        serviceOrderId: finalServiceOrderId || undefined,
        status: (statusFilter as LaborTimeStatus) || undefined,
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: "pause" | "resume" | "finish" | "cancel",
    item: LaborTime,
  ) => {
    try {
      await laborTimeService[action](item.id);
      const labels = {
        pause: "pausado",
        resume: "reanudado",
        finish: "completado",
        cancel: "cancelado",
      };
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Tiempo ${labels[action]}`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleStartSaved = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tiempo iniciado",
        life: 3000,
      });
      await loadItems();
      setStartDialog(false);
    })();
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const statusTemplate = (row: LaborTime) => (
    <LaborTimeStatusBadge status={row.status} />
  );

  const operationTemplate = (row: LaborTime) =>
    row.operation ? (
      <div>
        <div className="font-semibold text-sm">{row.operation.name}</div>
        <div className="text-xs text-500">{row.operation.code}</div>
      </div>
    ) : (
      <span className="text-500">—</span>
    );

  const durationTemplate = (row: LaborTime) => {
    if (row.realMinutes != null) return `${row.realMinutes} min`;
    if (row.status === "ACTIVE" || row.status === "PAUSED") {
      const started = new Date(row.startedAt).getTime();
      const elapsed =
        Math.floor((Date.now() - started) / 60000) - row.pausedMinutes;
      return `~${Math.max(0, elapsed)} min`;
    }
    return "—";
  };

  const efficiencyTemplate = (row: LaborTime) => {
    if (row.efficiency == null) return "—";
    const color =
      row.efficiency >= 90
        ? "text-green-600"
        : row.efficiency >= 70
        ? "text-yellow-600"
        : "text-red-600";
    return <span className={`font-bold ${color}`}>{row.efficiency}%</span>;
  };

  const dateTemplate = (row: LaborTime) =>
    new Date(row.startedAt).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const actionBodyTemplate = (rowData: LaborTime) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const STATUS_FILTER_OPTIONS = [
    { label: "Todos los estados", value: "" },
    ...Object.entries(LABOR_STATUS_LABELS).map(([v, l]) => ({
      label: l,
      value: v,
    })),
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Control de Tiempos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="ID de orden..."
            value={serviceOrderFilter}
            onChange={(e) => {
              setServiceOrderFilter(e.target.value);
              setPage(0);
            }}
            style={{ width: "14rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "12rem" }}
        />
        <CreateButton
          label="Iniciar tiempo"
          onClick={() => setStartDialog(true)}
          tooltip="Registrar nuevo tiempo de trabajo"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron registros de tiempo"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Operación"
            body={operationTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            field="technicianId"
            header="Técnico"
            style={{ minWidth: "160px" }}
          />
          <Column
            field="startedAt"
            header="Inicio"
            body={dateTemplate}
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Duración"
            body={durationTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="standardMinutes"
            header="Est. (min)"
            style={{ minWidth: "90px" }}
          />
          <Column
            header="Eficiencia"
            body={efficiencyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Start Dialog */}
      <Dialog
        visible={startDialog}
        style={{ width: "500px" }}
        breakpoints={{ "600px": "90vw" }}
        header={
          <div className="mb-2">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center gap-2">
                <i className="pi pi-play-circle text-primary text-3xl" />
                Iniciar Tiempo de Trabajo
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setStartDialog(false)}
        footer={
          <FormActionButtons
            formId="labor-time-start-form"
            isUpdate={false}
            onCancel={() => setStartDialog(false)}
            isSubmitting={isSubmitting}
            submitLabel="Iniciar"
          />
        }
      >
        <LaborTimeStartForm
          onSave={handleStartSaved}
          formId="labor-time-start-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Pausar",
                  icon: "pi pi-pause",
                  disabled: actionItem.status !== "ACTIVE",
                  command: () => handleAction("pause", actionItem),
                },
                {
                  label: "Reanudar",
                  icon: "pi pi-play",
                  disabled: actionItem.status !== "PAUSED",
                  command: () => handleAction("resume", actionItem),
                },
                {
                  label: "Finalizar",
                  icon: "pi pi-check",
                  disabled: !["ACTIVE", "PAUSED"].includes(actionItem.status),
                  command: () => handleAction("finish", actionItem),
                },
                { separator: true },
                {
                  label: "Cancelar",
                  icon: "pi pi-times",
                  className: "p-menuitem-danger",
                  disabled: !["ACTIVE", "PAUSED"].includes(actionItem.status),
                  command: () => handleAction("cancel", actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="labor-time-menu"
      />
    </motion.div>
  );
}
