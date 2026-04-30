"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import entryNoteService from "@/modules/inventory/entryNotes/services/entryNoteService";
import { handleFormError } from "@/utils/errorHandlers";
import type { EntryNote } from "@/modules/inventory/entryNotes/interfaces/entryNote.interface";
import {
  ENTRY_NOTE_STATUS_CONFIG,
  ENTRY_TYPE_LABELS,
} from "@/modules/inventory/entryNotes/interfaces/entryNote.interface";

// ── Types ──────────────────────────────────────────────────────────────────

interface CompleteEntryNoteDialogProps {
  visible: boolean;
  note: EntryNote | null;
  onHide: () => void;
  onSuccess: () => void;
  toast: React.RefObject<Toast> | null;
}

interface CompleteLine {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantityInNote: number;   // cantidad planificada (ORD)
  quantityReceived: number; // ya recibido en recepciones anteriores (REC)
  quantityPending: number;  // pendiente (PEND = ORD - REC)
  qtyToReceive: number;     // lo que se va a recepcionar ahora (A RECIBIR)
  unitCost: number;
  storedToLocation: string;
  batchNumber: string;
  expiryDate: Date | null;
}

// ── Column layout (idéntico a ReceiveOrderDialog) ─────────────────────────

const COL = {
  product:      { width: "13rem", flexShrink: 0 } as React.CSSProperties,
  ordered:      { width: "4rem",  flexShrink: 0 } as React.CSSProperties,
  received:     { width: "4rem",  flexShrink: 0 } as React.CSSProperties,
  pending:      { width: "4rem",  flexShrink: 0 } as React.CSSProperties,
  qtyToReceive: { width: "7rem",  flexShrink: 0 } as React.CSSProperties,
  unitCost:     { width: "7.5rem",flexShrink: 0 } as React.CSSProperties,
  location:     { width: "6.5rem",flexShrink: 0 } as React.CSSProperties,
  batch:        { width: "6.5rem",flexShrink: 0 } as React.CSSProperties,
  expiry:       { width: "7.5rem",flexShrink: 0 } as React.CSSProperties,
  subtotal:     { width: "6rem",  flexShrink: 0 } as React.CSSProperties,
};

const COLUMNS = [
  { label: "Producto",    style: COL.product },
  { label: "Ord.",        style: COL.ordered },
  { label: "Rec.",        style: COL.received },
  { label: "Pend.",       style: COL.pending },
  { label: "A Recibir",   style: COL.qtyToReceive },
  { label: "Costo Unit.", style: COL.unitCost },
  { label: "Ubicación",   style: COL.location },
  { label: "Lote",        style: COL.batch },
  { label: "Venc.",       style: COL.expiry },
  { label: "Subtotal",    style: COL.subtotal },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", VES: "Bs." };
const getCurrencySymbol = (c = "USD") => CURRENCY_SYMBOLS[c] ?? c;
const fmt = (value: number, currency = "USD") =>
  `${getCurrencySymbol(currency)} ${value.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Component ────────────────────────────────────────────────────────────────

const CompleteEntryNoteDialog = ({
  visible,
  note,
  onHide,
  onSuccess,
  toast,
}: CompleteEntryNoteDialogProps) => {
  const [lines, setLines] = useState<CompleteLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState("");

  const currency = note?.purchaseOrder?.currency ?? "USD";
  const exchangeRate = note?.purchaseOrder?.exchangeRate;

  // ── Initialize ────────────────────────────────────────────────────────────

  const initializeLines = useCallback(() => {
    if (!note?.items) return;
    setLines(
      note.items.map((it) => {
        const ord = it.quantityReceived; // cantidad planificada en la nota
        const rec = 0;                   // aún no recibido (se está completando ahora)
        const pend = ord - rec;
        return {
          id: it.id,
          itemId: it.itemId,
          itemName: it.itemName || it.item?.name || "",
          sku: it.item?.sku || "",
          quantityInNote: ord,
          quantityReceived: rec,
          quantityPending: pend,
          qtyToReceive: pend,
          unitCost: Number(it.unitCost),
          storedToLocation: it.storedToLocation || "",
          batchNumber: it.batchNumber || it.batch?.batchNumber || "",
          expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
        };
      })
    );
  }, [note]);

  useEffect(() => {
    if (visible && note) {
      initializeLines();
      setReceiveNotes("");
    }
  }, [visible, note, initializeLines]);

  // ── Field update ──────────────────────────────────────────────────────────

  const updateField = <K extends keyof CompleteLine>(
    index: number,
    field: K,
    value: CompleteLine[K]
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      if (field === "qtyToReceive") {
        const qty = Math.max(0, Number(value || 0));
        const max = copy[index].quantityPending;
        copy[index] = { ...copy[index], qtyToReceive: qty > max ? max : qty };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleReceiveAll = () =>
    setLines((prev) => prev.map((l) => ({ ...l, qtyToReceive: l.quantityPending })));

  const handleClearAll = () =>
    setLines((prev) => prev.map((l) => ({ ...l, qtyToReceive: 0 })));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!note) return;

    const toReceive = lines.filter((l) => l.qtyToReceive > 0);
    if (toReceive.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No hay cantidades para recepcionar",
      });
      return;
    }

    setSubmitting(true);
    try {
      await entryNoteService.update(note.id, {
        notes: receiveNotes || undefined,
        items: lines.map((l) => ({
          itemId: l.itemId,
          itemName: l.itemName,
          quantityReceived: l.qtyToReceive,
          unitCost: l.unitCost,
          storedToLocation: l.storedToLocation || null,
          batchNumber: l.batchNumber || null,
          expiryDate: l.expiryDate ? l.expiryDate.toISOString() : null,
        })),
      });
      await entryNoteService.complete(note.id);

      toast?.current?.show({
        severity: "success",
        summary: "Recepción completada",
        detail: `Nota ${note.entryNoteNumber} completada — Stock actualizado`,
        life: 4000,
      });

      onSuccess();
      onHide();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const totalUnits = useMemo(
    () => lines.reduce((sum, l) => sum + l.qtyToReceive, 0),
    [lines]
  );

  const totalAmount = useMemo(
    () => lines.reduce((sum, l) => sum + l.qtyToReceive * l.unitCost, 0),
    [lines]
  );

  const crossRef = useMemo(() => {
    const rate = Number(exchangeRate);
    if (currency === "VES") {
      if (rate <= 1) return null;
      return `≈ $ ${(totalAmount / rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    if (!rate || rate <= 0) return null;
    return `≈ Bs. ${(totalAmount * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [totalAmount, currency, exchangeRate]);

  // ── Dialogs ───────────────────────────────────────────────────────────────

  const statusCfg = note ? ENTRY_NOTE_STATUS_CONFIG[note.status] : null;

  const dialogHeader = (
    <div className="mb-2 text-center md:text-left">
      <div className="border-bottom-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
          <i className="pi pi-check-circle mr-3 text-green-500 text-3xl" />
          Confirmar Recepción: {note?.entryNoteNumber || ""}
        </h2>
      </div>
    </div>
  );

  const dialogFooter = (
    <div className="flex w-full gap-2 mb-4">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
        type="button"
        disabled={submitting}
        className="flex-1"
      />
      <Button
        label={`Recepcionar (${totalUnits} uds — ${fmt(totalAmount, currency)})`}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={submitting}
        disabled={totalUnits === 0}
        type="button"
        severity="success"
        className="flex-1"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={dialogHeader}
      footer={dialogFooter}
      style={{ width: "82vw" }}
      modal
      maximizable
    >
      <div onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>

        {/* ── Info de la nota ── */}
        {note && (
          <div className="grid mb-3 surface-50 border-round p-3">
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Proveedor</span>
              <div className="font-medium text-900">
                {note.purchaseOrder?.supplier?.name ||
                  note.catalogSupplier?.name ||
                  note.supplierName || "—"}
              </div>
              {note.purchaseOrder?.orderNumber && (
                <div className="text-500 text-xs mt-1">
                  <i className="pi pi-shopping-cart mr-1" />
                  OC: {note.purchaseOrder.orderNumber}
                </div>
              )}
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Almacén Destino</span>
              <div className="font-medium text-900">
                {note.warehouse?.name || "—"}
              </div>
              {note.warehouse?.code && (
                <div className="text-500 text-xs mt-1">Código: {note.warehouse.code}</div>
              )}
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Total Nota</span>
              <div className="font-medium text-primary">
                {fmt(totalAmount, currency)}
              </div>
              {crossRef && <div className="text-500 text-xs mt-1">{crossRef}</div>}
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Tipo / Estado</span>
              <div className="font-medium text-900 text-sm mt-1">
                {ENTRY_TYPE_LABELS[note.type]}
              </div>
              {statusCfg && (
                <div className="mt-1">
                  <Tag value={statusCfg.label} severity={statusCfg.severity} icon={statusCfg.icon} className="text-xs" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notas de recepción ── */}
        <div className="field mb-3">
          <label className="font-bold text-900 text-sm">Notas de Recepción</label>
          <InputText
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
            placeholder="Observaciones de esta recepción..."
            className="w-full"
            style={{ fontSize: "0.85rem" }}
          />
        </div>

        {/* ── Líneas ── */}
        <Divider align="left" className="my-0">
          <div className="flex align-items-center gap-2">
            <span className="p-tag">Líneas a Recepcionar</span>
            <Button
              type="button"
              label="Recibir Todo"
              icon="pi pi-check-circle"
              className="p-button-rounded p-button-text p-button-success p-button-sm"
              onClick={handleReceiveAll}
              disabled={submitting}
              style={{ height: "1.5rem", fontSize: "0.75rem" }}
            />
            <Button
              type="button"
              label="Limpiar"
              icon="pi pi-times-circle"
              className="p-button-rounded p-button-text p-button-secondary p-button-sm"
              onClick={handleClearAll}
              disabled={submitting}
              style={{ height: "1.5rem", fontSize: "0.75rem" }}
            />
          </div>
        </Divider>

        <div style={{ border: "1px solid var(--surface-300)", borderRadius: "6px", overflow: "hidden" }}>

          {/* Headers */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 8px",
            backgroundColor: "var(--surface-100)",
            borderBottom: "2px solid var(--surface-300)",
          }}>
            {COLUMNS.map((col, i) => (
              <div key={i} style={{
                ...col.style,
                fontSize: "0.7rem", fontWeight: 700,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "var(--text-color-secondary)", userSelect: "none",
              }}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {lines.length === 0 ? (
            <div className="text-center py-4 text-500" style={{ fontSize: "0.85rem" }}>
              <i className="pi pi-inbox mr-2" />
              No hay artículos en esta nota
            </div>
          ) : (
            lines.map((line, index) => (
              <div key={line.id + index} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "4px 8px",
                borderBottom: "1px solid var(--surface-200)",
              }}>

                {/* Producto */}
                <div style={COL.product}>
                  <div className="font-medium text-900" style={{ fontSize: "0.8rem" }}>
                    {line.sku || "—"}
                  </div>
                  <div className="text-500" style={{
                    fontSize: "0.7rem", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }} title={line.itemName}>
                    {line.itemName || "Sin nombre"}
                  </div>
                </div>

                {/* Ord. */}
                <div style={{ ...COL.ordered, textAlign: "center", fontSize: "0.8rem" }}>
                  {line.quantityInNote}
                </div>

                {/* Rec. */}
                <div style={{ ...COL.received, textAlign: "center", fontSize: "0.8rem" }}>
                  {line.quantityReceived}
                </div>

                {/* Pend. */}
                <div style={{ ...COL.pending, textAlign: "center", fontSize: "0.8rem" }}>
                  <span className={line.quantityPending > 0 ? "text-orange-500 font-bold" : "text-green-500"}>
                    {line.quantityPending}
                  </span>
                </div>

                {/* A Recibir */}
                <div style={COL.qtyToReceive}>
                  <InputNumber
                    value={line.qtyToReceive}
                    onValueChange={(e) => updateField(index, "qtyToReceive", e.value ?? 0)}
                    min={0}
                    max={line.quantityPending}
                    className="w-full"
                    inputClassName="w-full text-center"
                    inputStyle={{ padding: "0.25rem 0.4rem", height: "30px", fontSize: "0.8rem" }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Costo Unit. */}
                <div style={COL.unitCost}>
                  <InputNumber
                    value={line.unitCost}
                    onValueChange={(e) => updateField(index, "unitCost", e.value ?? 0)}
                    mode="decimal"
                    prefix={`${getCurrencySymbol(currency)} `}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    className="w-full"
                    inputClassName="w-full text-right"
                    inputStyle={{ padding: "0.25rem 0.4rem", height: "30px", fontSize: "0.8rem" }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Ubicación */}
                <div style={COL.location}>
                  <InputText
                    value={line.storedToLocation}
                    onChange={(e) => updateField(index, "storedToLocation", e.target.value)}
                    placeholder="Ubicación"
                    className="w-full"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }}
                  />
                </div>

                {/* Lote */}
                <div style={COL.batch}>
                  <InputText
                    value={line.batchNumber}
                    onChange={(e) => updateField(index, "batchNumber", e.target.value)}
                    placeholder="Lote"
                    className="w-full"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "30px" }}
                  />
                </div>

                {/* Vencimiento */}
                <div style={COL.expiry}>
                  <Calendar
                    value={line.expiryDate}
                    onChange={(e) => updateField(index, "expiryDate", e.value as Date | null)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                    placeholder="Fecha"
                    inputStyle={{ padding: "0.25rem 0.4rem", height: "30px", fontSize: "0.75rem" }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Subtotal */}
                <div style={{ ...COL.subtotal, textAlign: "right", fontSize: "0.8rem", fontWeight: 600 }}>
                  {fmt(line.qtyToReceive * line.unitCost, currency)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Totals footer ── */}
        {totalAmount > 0 && (
          <div className="flex justify-content-end mt-2">
            <div className="surface-100 border-round p-3" style={{ minWidth: "260px" }}>
              <Divider className="my-2" />
              <div className="flex justify-content-between align-items-center mb-1 text-sm">
                <span className="text-600">Unidades a recepcionar</span>
                <span className="text-700 font-bold">{totalUnits}</span>
              </div>
              <div className="flex justify-content-between align-items-center font-bold text-lg">
                <span className="text-900">Total Recepción</span>
                <span className="text-primary">{fmt(totalAmount, currency)}</span>
              </div>
              {crossRef && (
                <div className="flex justify-content-end text-xs text-500 mt-1">{crossRef}</div>
              )}
            </div>
          </div>
        )}

      </div>
    </Dialog>
  );
};

export default CompleteEntryNoteDialog;
