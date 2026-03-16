"use client";
import React from "react";
import { Controller, Control, UseFormRegister } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ItemOption {
  label: string;
  value: string;
}

/**
 * Column widths shared between ItemsTable `columns` prop and ItemRow cells.
 * Export your own constant from the form and pass it to both.
 *
 * Example:
 *   export const MY_COL: ItemRowColWidths = {
 *     handle:   { width: "1.75rem", flexShrink: 0 },
 *     product:  { flex: "1 1 0",    minWidth: 0 },
 *     quantity: { width: "5.5rem",  flexShrink: 0 },
 *     remove:   { width: "1.75rem", flexShrink: 0 },
 *   }
 */
export interface ItemRowColWidths {
  handle: React.CSSProperties;
  product: React.CSSProperties;
  quantity: React.CSSProperties;
  unitCost?: React.CSSProperties;
  location?: React.CSSProperties;
  batch?: React.CSSProperties;
  remove: React.CSSProperties;
}

/**
 * Full field paths for each column, e.g. "items.0.quantityReceived".
 * The error key is derived automatically from the last segment of the path.
 * Only provide paths for fields you want to render.
 */
export interface ItemRowFieldPaths {
  itemId: string;
  quantity: string;
  unitCost?: string;
  location?: string;
  batch?: string;
}

export interface ItemRowProps {
  // react-hook-form — typed as any so this works with any form schema
  control: Control<any>;
  register: UseFormRegister<any>;
  /** errors.items?.[index] — already scoped to this row */
  rowErrors?: Record<string, any>;

  itemOptions: ItemOption[];
  fieldPaths: ItemRowFieldPaths;
  colWidths: ItemRowColWidths;

  onRemove: () => void;
  canRemove: boolean;
  onAddRow: () => void;
  dragHandleProps: Record<string, unknown>;
  isDragging?: boolean;

  // Optional overrides
  quantityMin?: number;
  locationPlaceholder?: string;
  batchPlaceholder?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the last segment of a dot-path, used to look up errors by field name. */
const leafKey = (path: string) => path.split(".").pop() ?? path;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ItemRow({
  control,
  register,
  rowErrors,
  itemOptions,
  fieldPaths,
  colWidths,
  onRemove,
  canRemove,
  onAddRow,
  dragHandleProps,
  isDragging = false,
  quantityMin = 1,
  locationPlaceholder = "Ubicación",
  batchPlaceholder = "Lote",
}: ItemRowProps) {
  const itemIdKey = leafKey(fieldPaths.itemId);
  const qtyKey = leafKey(fieldPaths.quantity);
  const costKey = fieldPaths.unitCost ? leafKey(fieldPaths.unitCost) : null;
  const locKey = fieldPaths.location ? leafKey(fieldPaths.location) : null;
  const batchKey = fieldPaths.batch ? leafKey(fieldPaths.batch) : null;

  const itemError = rowErrors?.[itemIdKey]?.message;
  const qtyError = rowErrors?.[qtyKey]?.message;
  const costError = costKey ? rowErrors?.[costKey]?.message : null;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderBottom: "1px solid var(--surface-200)",
    backgroundColor: isDragging ? "var(--highlight-bg, #eff6ff)" : undefined,
    opacity: isDragging ? 0.75 : 1,
    boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.12)" : undefined,
    transition: "background 0.12s",
  };

  return (
    <div style={rowStyle}>
      {/* ── Drag handle ── */}
      <div
        style={{
          ...colWidths.handle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
        }}
        {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        <i
          className="pi pi-bars"
          style={{ color: "var(--text-color-secondary)", fontSize: "0.7rem" }}
          title="Arrastrar para reordenar"
        />
      </div>

      {/* ── Producto ── */}
      <div style={colWidths.product}>
        <Controller
          name={fieldPaths.itemId}
          control={control}
          render={({ field: f }) => (
            <Dropdown
              value={f.value}
              onChange={(e) => f.onChange(e.value)}
              options={itemOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione..."
              filter
              className={`w-full${itemError ? " p-invalid" : ""}`}
              pt={{
                input: {
                  style: { padding: "0.3rem 0.5rem", fontSize: "0.85rem" },
                },
              }}
            />
          )}
        />
        {itemError && (
          <small
            className="p-error"
            style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
          >
            {itemError}
          </small>
        )}
      </div>

      {/* ── Cantidad ── */}
      <div style={colWidths.quantity}>
        <Controller
          name={fieldPaths.quantity}
          control={control}
          render={({ field: f }) => (
            <InputNumber
              value={f.value}
              onValueChange={(e) => f.onChange(e.value)}
              min={quantityMin}
              className="w-full"
              inputClassName={`w-full text-right${
                qtyError ? " p-invalid" : ""
              }`}
              inputStyle={{ padding: "0.3rem 0.4rem", fontSize: "0.85rem" }}
            />
          )}
        />
        {qtyError && (
          <small
            className="p-error"
            style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
          >
            {qtyError}
          </small>
        )}
      </div>

      {/* ── Costo Unitario (optional) ── */}
      {fieldPaths.unitCost && colWidths.unitCost && (
        <div style={colWidths.unitCost}>
          <Controller
            name={fieldPaths.unitCost}
            control={control}
            render={({ field: f }) => (
              <InputNumber
                value={f.value}
                onValueChange={(e) => f.onChange(e.value)}
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
                mode="currency"
                currency="USD"
                locale="es-VE"
                className="w-full"
                inputClassName={`w-full text-right${
                  costError ? " p-invalid" : ""
                }`}
                inputStyle={{ padding: "0.3rem 0.4rem", fontSize: "0.85rem" }}
              />
            )}
          />
          {costError && (
            <small
              className="p-error"
              style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
            >
              {costError}
            </small>
          )}
        </div>
      )}

      {/* ── Ubicación (optional) ── */}
      {fieldPaths.location && colWidths.location && (
        <div style={colWidths.location}>
          <InputText
            {...register(fieldPaths.location)}
            placeholder={locationPlaceholder}
            className="w-full"
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
          />
        </div>
      )}

      {/* ── Lote / Batch (optional) — Enter adds a new row ── */}
      {fieldPaths.batch && colWidths.batch && (
        <div style={colWidths.batch}>
          <InputText
            {...register(fieldPaths.batch)}
            placeholder={batchPlaceholder}
            className="w-full"
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddRow();
              }
            }}
          />
        </div>
      )}

      {/* ── Remove ── */}
      <div
        style={{
          ...colWidths.remove,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-text"
          style={{ width: "1.5rem", height: "1.5rem" }}
          onClick={onRemove}
          disabled={!canRemove}
          tooltip="Eliminar fila"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    </div>
  );
}
