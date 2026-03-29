"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";

import interactionService from "@/app/api/crm/interactionService";
import {
  Interaction,
  INTERACTION_TYPE_CONFIG,
  INTERACTION_DIRECTION_CONFIG,
} from "@/libs/interfaces/crm/interaction.interface";
import InteractionForm from "./InteractionForm";

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
  customerId?: string; // if provided, filters by customer
}

export default function InteractionList({ customerId }: Props) {
  const toast = useRef<Toast>(null);

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<Interaction | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterType, filterChannel]);

  const openNew = () => { setEditItem(null); setFormVisible(true); };
  const openEdit = (item: Interaction) => { setEditItem(item); setFormVisible(true); };

  const handleDelete = (item: Interaction) => {
    confirmDialog({
      message: "¿Eliminar esta interacción?",
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await interactionService.delete(item.id);
          toast.current?.show({ severity: "success", summary: "Interacción eliminada" });
          load();
        } catch {
          toast.current?.show({ severity: "error", summary: "Error al eliminar" });
        }
      },
    });
  };

  // ── Columns ────────────────────────────────────────────────────────────────
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
    <div className="flex gap-1">
      <Button icon="pi pi-pencil" rounded text severity="secondary" size="small" onClick={() => openEdit(i)} />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => handleDelete(i)} />
    </div>
  );

  const formFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => setFormVisible(false)} disabled={formSubmitting} />
      <Button
        label={editItem ? "Guardar" : "Registrar"}
        icon="pi pi-check"
        form="interaction-form"
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
            <h4 className="mb-1 text-900">Interacciones</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <Button label="Nueva Interacción" icon="pi pi-plus" onClick={openNew} />
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
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.value)}
            options={channelFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
        </div>

        <DataTable
          value={interactions}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          emptyMessage="No hay interacciones registradas"
          size="small"
          stripedRows
        >
          {!customerId && <Column header="Cliente" body={customerBody} style={{ minWidth: "160px" }} />}
          {customerId && <Column header="Asunto" body={(i) => i.subject || "—"} />}
          <Column header="Tipo" body={typeBody} style={{ width: "130px" }} />
          <Column header="Dirección" body={directionBody} style={{ width: "120px" }} />
          <Column header="Notas" body={notesBody} />
          <Column header="Resultado" body={(i) => i.outcome || "—"} style={{ width: "160px" }} />
          <Column header="Fecha" body={dateBody} style={{ width: "110px" }} />
          <Column header="" body={actionsBody} style={{ width: "80px" }} />
        </DataTable>
      </motion.div>

      <Dialog
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        header={editItem ? "Editar Interacción" : "Nueva Interacción"}
        style={{ width: "680px" }}
        footer={formFooter}
        modal
        draggable={false}
      >
        <InteractionForm
          interaction={editItem}
          formId="interaction-form"
          defaultCustomerId={customerId}
          onSave={() => { setFormVisible(false); load(); }}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
