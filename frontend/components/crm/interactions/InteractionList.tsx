"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";

import interactionService from "@/app/api/crm/interactionService";
import {
  Interaction,
  INTERACTION_TYPE_CONFIG,
  INTERACTION_DIRECTION_CONFIG,
} from "@/libs/interfaces/crm/interaction.interface";
import InteractionForm from "./InteractionForm";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

const typeFilterOptions = [
  { label: "Todos los tipos", value: "" },
  { label: "Llamada", value: "CALL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Correo", value: "EMAIL" },
  { label: "Visita", value: "VISIT" },
  { label: "Nota", value: "NOTE" },
  { label: "Cotización", value: "QUOTE" },
  { label: "Seguimiento", value: "FOLLOW_UP" },
  { label: "Reunión", value: "MEETING" },
];

const channelFilterOptions = [
  { label: "Todos los canales", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
  { label: "General", value: "GENERAL" },
];

interface Props {
  customerId?: string;
}

export default function InteractionList({ customerId }: Props) {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [actionItem, setActionItem] = useState<Interaction | null>(null);

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<Interaction | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Interaction | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interactionService.getAll({
        page,
        limit,
        customerId: customerId || undefined,
        type: filterType || undefined,
        channel: filterChannel || undefined,
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setInteractions(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar interacciones" });
    } finally {
      setLoading(false);
    }
  }, [page, customerId, filterType, filterChannel]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterChannel]);

  const filteredInteractions = useMemo(() => {
    if (!searchQuery.trim()) return interactions;
    const q = searchQuery.toLowerCase();
    return interactions.filter((i) => {
      return (
        String(i.customer?.name || "").toLowerCase().includes(q) ||
        String(i.subject || "").toLowerCase().includes(q) ||
        String(i.notes || "").toLowerCase().includes(q) ||
        String(i.outcome || "").toLowerCase().includes(q)
      );
    });
  }, [interactions, searchQuery]);

  const openNew = () => {
    setEditItem(null);
    setFormVisible(true);
  };

  const openEdit = (item: Interaction) => {
    setEditItem(item);
    setFormVisible(true);
  };

  const openDelete = (item: Interaction) => {
    setDeleteItem(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      await interactionService.delete(deleteItem.id);
      toast.current?.show({ severity: "success", summary: "Interacción eliminada" });
      setDeleteDialog(false);
      setDeleteItem(null);
      await load();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al eliminar" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editItem ? "Interacción actualizada" : "Interacción registrada",
      life: 3000,
    });
    setFormVisible(false);
    setEditItem(null);
    await load();
  };

  const actionItems = (item: Interaction | null): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => openEdit(item),
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => openDelete(item),
      },
    ];
  };

  const typeBody = (i: Interaction) => {
    const cfg = INTERACTION_TYPE_CONFIG[i.type as keyof typeof INTERACTION_TYPE_CONFIG];
    return cfg ? <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" /> : null;
  };

  const directionBody = (i: Interaction) => {
    const cfg = INTERACTION_DIRECTION_CONFIG[i.direction as keyof typeof INTERACTION_DIRECTION_CONFIG];
    return cfg ? <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" /> : null;
  };

  const customerBody = (i: Interaction) => (
    <div>
      <div className="font-semibold text-sm">{i.customer?.name ?? "—"}</div>
      {i.subject && <div className="text-xs text-500">{i.subject}</div>}
    </div>
  );

  const notesBody = (i: Interaction) => (
    <div className="text-sm text-700 line-clamp-2" style={{ maxWidth: "300px" }}>
      {i.notes}
    </div>
  );

  const dateBody = (i: Interaction) => new Date(i.createdAt).toLocaleDateString("es-VE");

  const actionsBody = (i: Interaction) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(i);
        menuRef.current?.toggle(e);
      }}
      aria-controls="crm-interaction-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Interacciones</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
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
        <Dropdown
          value={filterChannel}
          onChange={(e) => {
            setFilterChannel(e.value);
            setPage(1);
          }}
          options={channelFilterOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Canal"
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
        <CreateButton label="Nueva interacción" onClick={openNew} tooltip="Registrar interacción" />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Menu ref={menuRef} popup model={actionItems(actionItem)} id="crm-interaction-menu" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <DataTable
          value={filteredInteractions}
          header={header}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay interacciones registradas"
          size="small"
          stripedRows
          scrollable
          sortMode="multiple"
        >
          {!customerId && <Column header="Cliente" body={customerBody} style={{ minWidth: "160px" }} />}
          {customerId && <Column header="Asunto" body={(i) => i.subject || "—"} />}
          <Column header="Tipo" body={typeBody} style={{ width: "130px" }} />
          <Column header="Dirección" body={directionBody} style={{ width: "120px" }} />
          <Column header="Notas" body={notesBody} />
          <Column header="Resultado" body={(i) => i.outcome || "—"} style={{ width: "160px" }} />
          <Column header="Fecha" body={dateBody} style={{ width: "110px" }} />
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
        itemName={deleteItem?.subject || deleteItem?.notes?.slice(0, 40) || "interacción"}
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
                <i className="pi pi-comments mr-3 text-primary text-3xl"></i>
                {editItem ? "Editar Interacción" : "Nueva Interacción"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="interaction-form"
            onCancel={() => {
              setFormVisible(false);
              setEditItem(null);
            }}
            isSubmitting={formSubmitting}
            isUpdate={!!editItem}
            submitLabel={editItem ? "Guardar" : "Registrar"}
          />
        }
      >
        <InteractionForm
          interaction={editItem}
          formId="interaction-form"
          defaultCustomerId={customerId}
          onSave={handleSave}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
