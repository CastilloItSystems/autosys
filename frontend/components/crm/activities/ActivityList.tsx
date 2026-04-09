"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";

import activityService from "@/app/api/crm/activityService";
import {
  Activity,
  ACTIVITY_TYPE_CONFIG,
  ACTIVITY_STATUS_CONFIG,
  ACTIVITY_STATUS_OPTIONS,
} from "@/libs/interfaces/crm/activity.interface";
import ActivityForm from "./ActivityForm";
import ActivityCompleteDialog from "./ActivityCompleteDialog";

const typeFilterOptions = [
  { label: "Todos los tipos", value: "" },
  { label: "Llamada", value: "CALL" },
  { label: "Correo", value: "EMAIL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Reunión", value: "MEETING" },
  { label: "Cotización", value: "QUOTE" },
  { label: "Tarea", value: "TASK" },
];

const statusFilterOptions = [
  { label: "Todos los estados", value: "" },
  ...ACTIVITY_STATUS_OPTIONS,
];

interface Props {
  customerId?: string;
}

export default function ActivityList({ customerId }: Props) {
  const toast = useRef<Toast>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [completeActivity, setCompleteActivity] = useState<Activity | null>(null);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityService.getAll({
        page,
        limit,
        customerId: customerId || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        sortOrder: "asc",
      });
      const raw = (res as any)?.data ?? res;
      setActivities(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar actividades" });
    } finally {
      setLoading(false);
    }
  }, [page, customerId, filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterType, filterStatus]);

  const openNew = () => { setEditItem(null); setFormVisible(true); };
  const openEdit = (item: Activity) => { setEditItem(item); setFormVisible(true); };

  const openComplete = (item: Activity) => {
    setCompleteActivity(item);
    setCompleteDialogVisible(true);
  };

  const handleDelete = (item: Activity) => {
    confirmDialog({
      message: `¿Eliminar la actividad "${item.title}"? Solo se pueden eliminar actividades pendientes o canceladas.`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await activityService.delete(item.id);
          toast.current?.show({ severity: "success", summary: "Actividad eliminada" });
          load();
        } catch (e: any) {
          toast.current?.show({
            severity: "error",
            summary: e?.response?.data?.message ?? "Error al eliminar",
          });
        }
      },
    });
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const titleBody = (a: Activity) => (
    <div>
      <div className="font-semibold text-sm">{a.title}</div>
      {!customerId && a.customer && (
        <div className="text-xs text-500">{a.customer.name}</div>
      )}
    </div>
  );

  const typeBody = (a: Activity) => {
    const cfg = ACTIVITY_TYPE_CONFIG[a.type as keyof typeof ACTIVITY_TYPE_CONFIG];
    return cfg ? <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" /> : null;
  };

  const statusBody = (a: Activity) => {
    const cfg = ACTIVITY_STATUS_CONFIG[a.status as keyof typeof ACTIVITY_STATUS_CONFIG];
    return cfg ? <Tag value={cfg.label} severity={cfg.severity} className="text-xs" /> : null;
  };

  const dueBody = (a: Activity) => {
    const isPast = a.status === "PENDING" && new Date(a.dueAt) < new Date();
    return (
      <span className={`text-sm ${isPast ? "text-red-500 font-semibold" : "text-600"}`}>
        {new Date(a.dueAt).toLocaleDateString("es-VE")}
        {isPast && " ·Vencida"}
      </span>
    );
  };

  const actionsBody = (a: Activity) => (
    <div className="flex gap-1">
      {["PENDING", "IN_PROGRESS"].includes(a.status as string) && (
        <Button
          icon="pi pi-check-circle"
          rounded text severity="success" size="small"
          tooltip="Completar"
          tooltipOptions={{ position: "top" }}
          onClick={() => openComplete(a)}
        />
      )}
      <Button icon="pi pi-pencil" rounded text severity="secondary" size="small" onClick={() => openEdit(a)} />
      <Button
        icon="pi pi-trash"
        rounded text severity="danger" size="small"
        onClick={() => handleDelete(a)}
        disabled={!["PENDING", "CANCELLED"].includes(a.status as string)}
      />
    </div>
  );

  const formFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => setFormVisible(false)} disabled={formSubmitting} />
      <Button
        label={editItem ? "Guardar" : "Crear Actividad"}
        icon="pi pi-check"
        form="activity-form"
        type="submit"
        loading={formSubmitting}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Actividades</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <Button label="Nueva Actividad" icon="pi pi-plus" onClick={openNew} />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Dropdown
            value={filterType}
            onChange={(e) => setFilterType(e.value)}
            options={typeFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
          <Dropdown
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.value)}
            options={statusFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
        </div>

        <DataTable
          value={activities}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          emptyMessage="No hay actividades registradas"
          size="small"
          stripedRows
        >
          <Column header="Actividad" body={titleBody} style={{ minWidth: "180px" }} />
          <Column header="Tipo" body={typeBody} style={{ width: "120px" }} />
          <Column header="Estado" body={statusBody} style={{ width: "130px" }} />
          <Column header="Vence" body={dueBody} style={{ width: "130px" }} />
          <Column header="Resultado" body={(a) => a.outcome || "—"} style={{ width: "180px" }} />
          <Column header="" body={actionsBody} style={{ width: "110px" }} />
        </DataTable>
      </motion.div>

      {/* Form Dialog */}
      <Dialog
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        header={editItem ? "Editar Actividad" : "Nueva Actividad"}
        style={{ width: "620px" }}
        footer={formFooter}
        modal
        draggable={false}
      >
        <ActivityForm
          activity={editItem}
          formId="activity-form"
          defaultCustomerId={customerId}
          onSave={() => { setFormVisible(false); load(); }}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Complete Dialog */}
      <ActivityCompleteDialog
        activity={completeActivity}
        visible={completeDialogVisible}
        onHide={() => setCompleteDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />
    </>
  );
}
