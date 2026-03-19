"use client";
import React, { useState, useEffect } from "react";
import { Controller, Control, UseFormRegister } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
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
  itemName?: React.CSSProperties;
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
  itemName: string;
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
  suggestions?: any[];
  onSearch?: (event: AutoCompleteCompleteEvent) => void;
  itemTemplate?: (item: any) => React.ReactNode;
  items?: any[];

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
  onItemChange?: (itemId: string) => void;
  selectedItemsMap?: Record<string, any>;
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
  onItemChange,
  suggestions = [],
  onSearch,
  itemTemplate,
  items = [],
  selectedItemsMap = {},
}: ItemRowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemIdKey = leafKey(fieldPaths.itemId);
  const itemNameKey = leafKey(fieldPaths.itemName);
  const qtyKey = leafKey(fieldPaths.quantity);
  const costKey = fieldPaths.unitCost ? leafKey(fieldPaths.unitCost) : null;
  const locKey = fieldPaths.location ? leafKey(fieldPaths.location) : null;
  const batchKey = fieldPaths.batch ? leafKey(fieldPaths.batch) : null;

  const itemError = rowErrors?.[itemIdKey]?.message;
  const itemNameError = rowErrors?.[itemNameKey]?.message;
  const qtyError = rowErrors?.[qtyKey]?.message;
  const costError = costKey ? rowErrors?.[costKey]?.message : null;

  /**
   * Resolve the current value (ID) to display text for AutoComplete.
   * Returns the item object (for AutoComplete's field prop) when found,
   * or the raw string if not resolved.
   */
  const resolveItem = (val: any): any => {
    if (!val) return "";
    if (typeof val !== "string") return val;

    // Try selected items map first (persists across searches)
    const foundInMap = selectedItemsMap[val];
    if (foundInMap) return foundInMap;

    // Try to find in suggestions (latest search results)
    const foundInSuggestions = suggestions.find((s) => s.id === val);
    if (foundInSuggestions) return foundInSuggestions;

    // Try to find in initial items catalog
    const foundInCatalog = items.find((i) => i.id === val);
    if (foundInCatalog) return foundInCatalog;

    return val; // Fallback to ID string
  };

  /** Format an item object to show SKU (or code) in the input */
  const formatItemDisplay = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.sku || item.code || item.name || "";
  };

  /**
   * Returns the display value for AutoComplete.
   * If the item is resolved, returns the SKU/code string.
   * During typing (string input), returns as-is.
   */
  const resolveValue = (val: any): any => {
    if (!val) return "";
    if (typeof val !== "string") return val; // object during selection
    const item = resolveItem(val);
    if (typeof item === "string") return item; // not found, show raw
    return item; // return object, AutoComplete will use `field` prop
  };

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
            <AutoComplete
              value={resolveValue(f.value)}
              suggestions={suggestions}
              completeMethod={onSearch}
              field="sku"
              selectedItemTemplate={(item: any) => {
                if (!item) return "";
                if (typeof item === "string") return item;
                return item.sku || item.code || item.name || "";
              }}
              placeholder="SKU o Nombre..."
              itemTemplate={itemTemplate}
              className={`w-full ${itemError ? "p-invalid" : ""}`}
              inputClassName="w-full text-xs"
              inputStyle={{
                padding: "0.2rem 0.5rem",
                height: "30px",
                fontSize: "0.8rem",
                width: "100%",
              }}
              style={{ height: "30px", width: "100%" }}
              onSelect={(e) => {
                const selectedItem = e.value;
                f.onChange(selectedItem.id);
                if (onItemChange) onItemChange(selectedItem.id);
              }}
              onChange={(e) => {
                if (typeof e.value === "string") f.onChange(e.value);
              }}
              appendTo={mounted ? document.body : "self"}
              forceSelection={false}
              showEmptyMessage
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

      {/* ── Nombre Snapshot ── */}
      {fieldPaths.itemName && colWidths.itemName && (
        <div style={colWidths.itemName}>
          <InputText
            {...register(fieldPaths.itemName)}
            placeholder="Nombre..."
            className={`w-full ${itemNameError ? "p-invalid" : ""}`}
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.5rem",
              height: "30px",
            }}
          />
          {itemNameError && (
            <small
              className="p-error"
              style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
            >
              {itemNameError}
            </small>
          )}
        </div>
      )}

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
              inputClassName={`w-full text-center ${
                qtyError ? "p-invalid" : ""
              }`}
              inputStyle={{
                padding: "0.25rem 0.4rem",
                height: "30px",
                fontSize: "0.8rem",
              }}
              style={{ height: "30px" }}
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
                inputClassName={`w-full text-right ${
                  costError ? "p-invalid" : ""
                }`}
                inputStyle={{
                  padding: "0.25rem 0.4rem",
                  height: "30px",
                  fontSize: "0.8rem",
                }}
                style={{ height: "30px" }}
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
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              height: "30px",
            }}
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
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              height: "30px",
            }}
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
