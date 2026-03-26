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
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/libs/interfaces/inventory";

// ── Types ──────────────────────────────────────────────────────────────────

interface ReceiveOrderDialogProps {
  visible: boolean;
  order: PurchaseOrder | null;
  onHide: () => void;
  onSuccess: (updatedOrder: any) => void;
  toast: React.RefObject<Toast> | null;
}

interface LineToReceive {
  itemId: string;
  itemName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  qtyToReceive: number;
  unitCost: number;
  location: string;
  batchNumber: string;
  expiryDate: Date | null;
}

// ── Column widths (mirrors ItemsTable pattern) ─────────────────────────────

const COL = {
  product: { width: "14rem", flexShrink: 0 } as React.CSSProperties,
  ordered: { width: "4.5rem", flexShrink: 0 } as React.CSSProperties,
  received: { width: "4.5rem", flexShrink: 0 } as React.CSSProperties,
  pending: { width: "4.5rem", flexShrink: 0 } as React.CSSProperties,
  qtyToReceive: { width: "7rem", flexShrink: 0 } as React.CSSProperties,
  unitCost: { width: "7rem", flexShrink: 0 } as React.CSSProperties,
  location: { width: "7rem", flexShrink: 0 } as React.CSSProperties,
  batch: { width: "6.5rem", flexShrink: 0 } as React.CSSProperties,
  expiry: { width: "7.5rem", flexShrink: 0 } as React.CSSProperties,
  subtotal: { width: "6rem", flexShrink: 0 } as React.CSSProperties,
};

const COLUMNS = [
  { label: "Producto", style: COL.product },
  { label: "Ord.", style: COL.ordered },
  { label: "Rec.", style: COL.received },
  { label: "Pend.", style: COL.pending },
  { label: "A Recibir", style: COL.qtyToReceive },
  { label: "Costo Unit.", style: COL.unitCost },
  { label: "Ubicación", style: COL.location },
  { label: "Lote", style: COL.batch },
  { label: "Venc.", style: COL.expiry },
  { label: "Subtotal", style: COL.subtotal },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Component ───────────────────────────────────────────────────────────────

const ReceiveOrderDialog = ({
  visible,
  order,
  onHide,
  onSuccess,
  toast,
}: ReceiveOrderDialogProps) => {
  const [lines, setLines] = useState<LineToReceive[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const initializeLines = useCallback(() => {
    if (!order?.items) return;

    const initialLines: LineToReceive[] = order.items
      .filter((line) => line.quantityPending > 0)
      .map((line: PurchaseOrderItem) => ({
        itemId: line.itemId,
        itemName: line.itemName || line.item?.name || "",
        sku: line.item?.sku || "",
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        quantityPending: line.quantityPending,
        qtyToReceive: line.quantityPending,
        unitCost: Number(line.unitCost),
        location: line.item?.location || "",
        batchNumber: "",
        expiryDate: null,
      }));

    setLines(initialLines);
  }, [order]);

  useEffect(() => {
    if (visible && order) {
      initializeLines();
      setNotes("");
    }
  }, [visible, order, initializeLines]);

  // ── Field update ──

  const updateField = <K extends keyof LineToReceive>(
    index: number,
    field: K,
    value: LineToReceive[K],
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      if (field === "qtyToReceive") {
        const qty = Math.max(0, Number(value || 0));
        const maxQty = copy[index].quantityPending;
        copy[index] = {
          ...copy[index],
          qtyToReceive: qty > maxQty ? maxQty : qty,
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleReceiveAll = () => {
    setLines((prev) =>
      prev.map((line) => ({ ...line, qtyToReceive: line.quantityPending })),
    );
  };

  const handleClearAll = () => {
    setLines((prev) => prev.map((line) => ({ ...line, qtyToReceive: 0 })));
  };

  // ── Submit ──

  const handleSubmit = async () => {
    const itemsToReceive = lines
      .filter((line) => line.qtyToReceive > 0)
      .map((line) => ({
        itemId: line.itemId,
        quantityReceived: line.qtyToReceive,
        unitCost: line.unitCost,
        location: line.location || null,
        batchNumber: line.batchNumber || null,
        expiryDate: line.expiryDate
          ? new Date(line.expiryDate).toISOString()
          : null,
      }));

    if (itemsToReceive.length === 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "No hay cantidades para recepcionar",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await purchaseOrderService.receive(order!.id, {
        notes: notes || undefined,
        items: itemsToReceive,
      });

      toast?.current?.show({
        severity: "success",
        summary: "Recepción exitosa",
        detail: `Orden ${order!.orderNumber} recepcionada correctamente`,
      });

      const updatedOrder = response.data;
      onSuccess(updatedOrder);
      onHide();
    } catch (error) {
      console.error("Error receiving order:", error);
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Totals ──

  const totalUnits = useMemo(
    () => lines.reduce((sum, l) => sum + l.qtyToReceive, 0),
    [lines],
  );

  const totalAmount = useMemo(
    () => lines.reduce((sum, l) => sum + l.qtyToReceive * l.unitCost, 0),
    [lines],
  );

  // ── Header (same pattern as PurchaseOrderList form dialog) ──

  const dialogHeader = (
    <div className="mb-2 text-center md:text-left">
      <div className="border-bottom-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
          <i className="pi pi-truck mr-3 text-primary text-3xl"></i>
          Recepcionar Orden: {order?.orderNumber || ""}
        </h2>
      </div>
    </div>
  );

  // ── Footer (same pattern as FormActionButtons) ──

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
        label={`Recepcionar (${totalUnits} uds — ${formatCurrency(
          totalAmount,
        )})`}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={submitting}
        disabled={totalUnits === 0}
        type="button"
        className="flex-1"
      />
    </div>
  );

  // ── Render ──

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={dialogHeader}
      footer={dialogFooter}
      style={{ width: "80vw" }}
      modal
      maximizable
    >
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        {/* ── Info de la orden ── */}
        {order && (
          <div className="grid mb-3 surface-50 border-round p-3">
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Proveedor</span>
              <div className="font-medium text-900">
                {order.supplier?.name || "—"}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Almacén Destino</span>
              <div className="font-medium text-900">
                {order.warehouse?.name || "—"}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Total Orden</span>
              <div className="font-medium text-900">
                {formatCurrency(Number(order.total || 0))}
              </div>
            </div>
            <div className="col-12 md:col-3">
              <span className="text-500 text-sm">Estado</span>
              <div className="mt-1">
                <Tag
                  value={order.status}
                  severity={order.status === "SENT" ? "info" : "warning"}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Notas de recepción ── */}
        <div className="field mb-3">
          <label htmlFor="receive-notes" className="font-bold text-900 text-sm">
            Notas de Recepción
          </label>
          <InputText
            id="receive-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones de esta recepción..."
            className="w-full"
            style={{ fontSize: "0.85rem" }}
          />
        </div>

        {/* ── Líneas a recepcionar (ItemsTable visual pattern) ── */}
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

        <div
          style={{
            border: "1px solid var(--surface-300)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Column headers (same as ItemsTable) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              backgroundColor: "var(--surface-100)",
              borderBottom: "2px solid var(--surface-300)",
            }}
          >
            {COLUMNS.map((col, i) => (
              <div
                key={i}
                style={{
                  ...col.style,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--text-color-secondary)",
                  userSelect: "none",
                }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {lines.length === 0 ? (
            <div
              className="text-center py-4 text-500"
              style={{ fontSize: "0.85rem" }}
            >
              <i className="pi pi-info-circle mr-2"></i>
              No hay líneas pendientes de recepcionar
            </div>
          ) : (
            lines.map((line, index) => (
              <div
                key={line.itemId + index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1px solid var(--surface-200)",
                  transition: "background 0.12s",
                }}
              >
                {/* Producto */}
                <div style={COL.product}>
                  <div
                    className="font-medium text-900"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {line.sku || "—"}
                  </div>
                  <div
                    className="text-500"
                    style={{
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={line.itemName}
                  >
                    {line.itemName || "Sin nombre"}
                  </div>
                </div>

                {/* Ordenado */}
                <div
                  style={{
                    ...COL.ordered,
                    textAlign: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  {line.quantityOrdered}
                </div>

                {/* Recibido */}
                <div
                  style={{
                    ...COL.received,
                    textAlign: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  {line.quantityReceived}
                </div>

                {/* Pendiente */}
                <div
                  style={{
                    ...COL.pending,
                    textAlign: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  <span className="text-orange-500 font-bold">
                    {line.quantityPending}
                  </span>
                </div>

                {/* A Recibir */}
                <div style={COL.qtyToReceive}>
                  <InputNumber
                    value={line.qtyToReceive}
                    onValueChange={(e) =>
                      updateField(index, "qtyToReceive", e.value ?? 0)
                    }
                    min={0}
                    max={line.quantityPending}
                    className="w-full"
                    inputClassName="w-full text-center"
                    inputStyle={{
                      padding: "0.25rem 0.4rem",
                      height: "30px",
                      fontSize: "0.8rem",
                    }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Costo Unit. */}
                <div style={COL.unitCost}>
                  <InputNumber
                    value={line.unitCost}
                    onValueChange={(e) =>
                      updateField(index, "unitCost", e.value ?? 0)
                    }
                    mode="currency"
                    currency="USD"
                    locale="es-VE"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    className="w-full"
                    inputClassName="w-full text-right"
                    inputStyle={{
                      padding: "0.25rem 0.4rem",
                      height: "30px",
                      fontSize: "0.8rem",
                    }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Ubicación */}
                <div style={COL.location}>
                  <InputText
                    value={line.location || ""}
                    onChange={(e) =>
                      updateField(index, "location", e.target.value)
                    }
                    placeholder="Ubicación"
                    className="w-full"
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      height: "30px",
                    }}
                  />
                </div>

                {/* Lote */}
                <div style={COL.batch}>
                  <InputText
                    value={line.batchNumber}
                    onChange={(e) =>
                      updateField(index, "batchNumber", e.target.value)
                    }
                    placeholder="Lote"
                    className="w-full"
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      height: "30px",
                    }}
                  />
                </div>

                {/* Vencimiento */}
                <div style={COL.expiry}>
                  <Calendar
                    value={line.expiryDate}
                    onChange={(e) =>
                      updateField(index, "expiryDate", e.value as Date | null)
                    }
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                    placeholder="Fecha"
                    inputStyle={{
                      padding: "0.25rem 0.4rem",
                      height: "30px",
                      fontSize: "0.75rem",
                    }}
                    style={{ height: "30px" }}
                  />
                </div>

                {/* Subtotal */}
                <div
                  style={{
                    ...COL.subtotal,
                    textAlign: "right",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(line.qtyToReceive * line.unitCost)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Totals footer (same pattern as TotalsFooter) ── */}
        {totalAmount > 0 && (
          <div className="flex justify-content-end mt-2">
            <div
              className="surface-100 border-round p-3"
              style={{ minWidth: "260px" }}
            >
              <Divider className="my-2" />
              <div className="flex justify-content-between align-items-center mb-1 text-sm">
                <span className="text-600">Unidades a recibir</span>
                <span className="text-700 font-bold">{totalUnits}</span>
              </div>
              <div className="flex justify-content-between align-items-center font-bold text-lg">
                <span className="text-900">Total Recepción</span>
                <span className="text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ReceiveOrderDialog;
