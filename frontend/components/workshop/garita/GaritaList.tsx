"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { garitaService } from "@/app/api/workshop";
import type { GaritaEvent, GaritaEventStatus, GaritaEventType } from "@/libs/interfaces/workshop";
import GaritaStatusBadge, {
  GARITA_STATUS_LABELS,
  GARITA_TYPE_LABELS,
  GARITA_TYPE_ICON,
  GARITA_VALID_TRANSITIONS,
} from "./GaritaStatusBadge";
import GaritaForm from "./GaritaForm";
import GaritaDetailDialog from "./GaritaDetailDialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";

interface Props {
  serviceOrderId?: string;
  embedded?: boolean;
}

const STATUS_OPTIONS = (Object.keys(GARITA_STATUS_LABELS) as GaritaEventStatus[]).map((s) => ({
  label: GARITA_STATUS_LABELS[s],
  value: s,
}));

const TYPE_OPTIONS = (Object.keys(GARITA_TYPE_LABELS) as GaritaEventType[]).map((t) => ({
  label: GARITA_TYPE_LABELS[t],
  value: t,
}));

export default function GaritaList({ serviceOrderId, embedded }: Props) {
  const [items, setItems] = useState<GaritaEvent[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GaritaEventStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<GaritaEventType | undefined>();
  const [page, setPage] = useState(0);
  const [rows] = useState(25);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selected, setSelected] = useState<GaritaEvent | null>(null);
  const [newStatus, setNewStatus] = useState<GaritaEventStatus | undefined>();
  const [kmOut, setKmOut] = useState<number | null>(null);
  const [exitPassRef, setExitPassRef] = useState("");
  const [irregularityNotes, setIrregularityNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailEvent, setDetailEvent] = useState<GaritaEvent | null>(null);
  const toast = useRef<Toast>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await garitaService.getAll({
        serviceOrderId: serviceOrderId || undefined,
        status: statusFilter,
        type: typeFilter,
        search: searchQuery || undefined,
        page: page + 1,
        limit: rows,
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

  useEffect(() => {
    if (embedded && !serviceOrderId) return;
    setPage(0);
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceOrderId, statusFilter, typeFilter, searchQuery, embedded]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSaved = () => {
    toast.current?.show({ severity: "success", summary: "Registro creado", life: 3000 });
    loadItems();
    setFormDialog(false);
  };

  const openStatusChange = (item: GaritaEvent) => {
    setSelected(item);
    setNewStatus(undefined);
    setKmOut(null);
    setExitPassRef("");
    setIrregularityNotes("");
    setStatusDialog(true);
  };

  const handleStatusChange = async () => {
    if (!selected || !newStatus) return;
    setIsSubmitting(true);
    try {
      await garitaService.updateStatus(selected.id, {
        status: newStatus,
        kmOut: kmOut ?? undefined,
        exitPassRef: exitPassRef || undefined,
        irregularityNotes: irregularityNotes || undefined,
      });
      toast.current?.show({ severity: "success", summary: "Estado actualizado", life: 3000 });
      loadItems();
      setStatusDialog(false);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: GaritaEvent) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await garitaService.remove(item.id);
      toast.current?.show({ severity: "success", summary: "Registro eliminado", life: 3000 });
      loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const typeTemplate = (row: GaritaEvent) => (
    <span className="flex align-items-center gap-2">
      <i className={`${GARITA_TYPE_ICON[row.type]} text-primary`} />
      <span className="text-sm">{GARITA_TYPE_LABELS[row.type]}</span>
    </span>
  );

  const statusTemplate = (row: GaritaEvent) => (
    <div className="flex align-items-center gap-2">
      <GaritaStatusBadge status={row.status} />
      {row.hasIrregularity && (
        <i className="pi pi-exclamation-triangle text-red-500" title={row.irregularityNotes ?? "Irregularidad"} />
      )}
    </div>
  );

  const plateTemplate = (row: GaritaEvent) => (
    <span className="font-bold text-primary">{row.plateNumber ?? "—"}</span>
  );

  const orderTemplate = (row: GaritaEvent) =>
    row.serviceOrder ? (
      <span className="font-semibold">{row.serviceOrder.folio}</span>
    ) : row.tot ? (
      <span className="text-500 text-sm">{row.tot.totNumber}</span>
    ) : (
      <span className="text-500">—</span>
    );

  const dateTemplate = (row: GaritaEvent) =>
    new Date(row.eventAt).toLocaleString("es-VE", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  const actionsTemplate = (row: GaritaEvent) => {
    const nextStatuses = GARITA_VALID_TRANSITIONS[row.status];
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-eye"
          size="small"
          text
          tooltip="Ver detalle"
          onClick={() => setDetailEvent(row)}
        />
        {nextStatuses.length > 0 && (
          <Button
            icon="pi pi-sync"
            size="small"
            severity="info"
            text
            tooltip="Cambiar estado"
            onClick={() => openStatusChange(row)}
          />
        )}
        {["PENDING", "CANCELLED"].includes(row.status) && (
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            text
            tooltip="Eliminar"
            onClick={() => handleDelete(row)}
          />
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <Toast ref={toast} />

      <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h2 className="text-2xl font-bold m-0">Control de Garita</h2>
        <div className="flex gap-2 flex-wrap">
          {!embedded && (
            <>
              <InputText
                placeholder="Buscar placa, conductor…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-15rem"
              />
              <Dropdown
                value={typeFilter}
                options={TYPE_OPTIONS}
                onChange={(e) => setTypeFilter(e.value)}
                placeholder="Todos los tipos"
                showClear
                className="w-14rem"
              />
              <Dropdown
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.value)}
                placeholder="Todos los estados"
                showClear
                className="w-12rem"
              />
            </>
          )}
          <CreateButton label="Registrar movimiento" onClick={() => setFormDialog(true)} />
        </div>
      </div>

      <DataTable
        value={items}
        loading={loading}
        paginator
        lazy
        rows={rows}
        totalRecords={totalRecords}
        first={page * rows}
        onPage={(e) => setPage(e.page ?? 0)}
        emptyMessage="No hay registros de garita"
        stripedRows
        size="small"
      >
        <Column body={dateTemplate} header="Fecha/Hora" style={{ width: "10rem" }} />
        <Column body={typeTemplate} header="Tipo" style={{ width: "14rem" }} />
        <Column body={plateTemplate} header="Placa" style={{ width: "7rem" }} />
        <Column field="driverName" header="Conductor" />
        {!embedded && <Column body={orderTemplate} header="OS / T.O.T." style={{ width: "8rem" }} />}
        <Column body={statusTemplate} header="Estado" style={{ width: "10rem" }} />
        <Column body={actionsTemplate} header="Acciones" style={{ width: "8rem" }} />
      </DataTable>

      {/* Detail Dialog */}
      <GaritaDetailDialog
        event={detailEvent}
        visible={!!detailEvent}
        onHide={() => setDetailEvent(null)}
      />

      {/* Form Dialog */}
      <Dialog
        header="Registrar movimiento de garita"
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        style={{ width: "52rem" }}
        maximizable modal draggable={false}
      >
        <GaritaForm
          serviceOrderId={serviceOrderId}
          toast={toast}
          onSaved={handleSaved}
          onCancel={() => setFormDialog(false)}
        />
      </Dialog>

      {/* Status Dialog */}
      <Dialog
        header="Actualizar estado"
        visible={statusDialog}
        onHide={() => setStatusDialog(false)}
        style={{ width: "32rem" }}
        modal draggable={false}
      >
        {selected && (
          <div className="flex flex-column gap-3 p-2">
            <p className="m-0 text-600">
              Estado actual: <GaritaStatusBadge status={selected.status} />
            </p>

            <div>
              <label className="font-semibold block mb-1">Nuevo estado</label>
              <Dropdown
                value={newStatus}
                options={GARITA_VALID_TRANSITIONS[selected.status].map((s) => ({
                  label: GARITA_STATUS_LABELS[s],
                  value: s,
                }))}
                onChange={(e) => setNewStatus(e.value)}
                placeholder="Seleccionar"
                className="w-full"
              />
            </div>

            {newStatus === "AUTHORIZED" && (
              <div>
                <label className="font-semibold block mb-1">Referencia pase de salida</label>
                <InputText
                  value={exitPassRef}
                  onChange={(e) => setExitPassRef(e.target.value)}
                  className="w-full"
                  placeholder="Nro. de pase firmado"
                />
              </div>
            )}

            {newStatus === "COMPLETED" && (
              <div>
                <label className="font-semibold block mb-1">Kilometraje de salida</label>
                <InputNumber
                  value={kmOut}
                  onValueChange={(e) => setKmOut(e.value ?? null)}
                  useGrouping={false}
                  className="w-full"
                />
              </div>
            )}

            {newStatus === "FLAGGED" && (
              <div>
                <label className="font-semibold block mb-1">Descripción de la irregularidad</label>
                <InputTextarea
                  value={irregularityNotes}
                  onChange={(e) => setIrregularityNotes(e.target.value)}
                  rows={3}
                  className="w-full"
                  autoResize
                />
              </div>
            )}

            <div className="flex justify-content-end gap-2 mt-2">
              <Button label="Cancelar" severity="secondary" outlined onClick={() => setStatusDialog(false)} />
              <Button
                label="Guardar"
                disabled={!newStatus || isSubmitting}
                loading={isSubmitting}
                onClick={handleStatusChange}
              />
            </div>
          </div>
        )}
      </Dialog>
    </motion.div>
  );
}
