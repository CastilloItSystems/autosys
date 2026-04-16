"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
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
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

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
  const menuRef = useRef<Menu>(null);
  const [actionItem, setActionItem] = useState<Activity | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Activity | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus]);

  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter((a) => {
      return (
        String(a.title || "").toLowerCase().includes(q) ||
        String(a.customer?.name || "").toLowerCase().includes(q) ||
        String(a.outcome || "").toLowerCase().includes(q)
      );
    });
  }, [activities, searchQuery]);

  const openNew = () => {
    setEditItem(null);
    setFormVisible(true);
  };

  const openEdit = (item: Activity) => {
    setEditItem(item);
    setFormVisible(true);
  };

  const openComplete = (item: Activity) => {
    setCompleteActivity(item);
    setCompleteDialogVisible(true);
  };

  const openDelete = (item: Activity) => {
    setDeleteItem(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      await activityService.delete(deleteItem.id);
      toast.current?.show({ severity: "success", summary: "Actividad eliminada" });
      setDeleteDialog(false);
      setDeleteItem(null);
      await load();
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: e?.response?.data?.message ?? "Error al eliminar",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editItem ? "Actividad actualizada" : "Actividad creada",
      life: 3000,
    });
    setFormVisible(false);
    setEditItem(null);
    await load();
  };

  const actionItems = (item: Activity | null): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => openEdit(item),
      },
      {
        label: "Completar",
        icon: "pi pi-check-circle",
        command: () => openComplete(item),
        disabled: !["PENDING", "IN_PROGRESS"].includes(item.status as string),
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => openDelete(item),
        disabled: !["PENDING", "CANCELLED"].includes(item.status as string),
      },
    ];
  };

  const titleBody = (a: Activity) => (
    <div>
      <div className="font-semibold text-sm">{a.title}</div>
      {!customerId && a.customer && <div className="text-xs text-500">{a.customer.name}</div>}
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
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(a);
        menuRef.current?.toggle(e);
      }}
      aria-controls="crm-activity-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Actividades</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.value);
            setPage(1);
          }}
          options={statusFilterOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={filterType}
          onChange={(e) => {
            setFilterType(e.value);
            setPage(1);
          }}
          options={typeFilterOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          style={{ minWidth: "160px" }}
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
        <CreateButton label="Nueva actividad" onClick={openNew} tooltip="Crear actividad" />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Menu ref={menuRef} popup model={actionItems(actionItem)} id="crm-activity-menu" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <DataTable
          value={filteredActivities}
          header={header}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay actividades registradas"
          size="small"
          stripedRows
          scrollable
          sortMode="multiple"
        >
          <Column header="Actividad" body={titleBody} style={{ minWidth: "180px" }} />
          <Column header="Tipo" body={typeBody} style={{ width: "120px" }} />
          <Column header="Estado" body={statusBody} style={{ width: "130px" }} />
          <Column header="Vence" body={dueBody} style={{ width: "130px" }} />
          <Column header="Resultado" body={(a) => a.outcome || "—"} style={{ width: "180px" }} />
          <Column
            header="Acciones"
            body={actionsBody}
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </motion.div>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setDeleteItem(null);
        }}
        onConfirm={handleDelete}
        itemName={deleteItem?.title || "actividad"}
        isDeleting={isDeleting}
      />

      <Dialog
        visible={formVisible}
        onHide={() => {
          setFormVisible(false);
          setEditItem(null);
        }}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-calendar mr-3 text-primary text-3xl"></i>
                {editItem ? "Editar Actividad" : "Nueva Actividad"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="activity-form"
            onCancel={() => {
              setFormVisible(false);
              setEditItem(null);
            }}
            isSubmitting={formSubmitting}
            isUpdate={!!editItem}
            submitLabel={editItem ? "Guardar" : "Crear Actividad"}
          />
        }
      >
        <ActivityForm
          activity={editItem}
          formId="activity-form"
          defaultCustomerId={customerId}
          onSave={handleSave}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>

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
