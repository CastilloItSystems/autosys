"use client";
import React, { useState, useEffect, useRef } from "react";
import { Controller, Control, UseFormRegister } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { catalogSearchService } from "@/app/api/workshop";
import type { UnifiedCatalogItem } from "@/app/api/workshop/catalogSearchService";
import { Dialog } from "primereact/dialog";
import ItemForm from "@/components/inventory/items/ItemForm";
import WorkshopOperationForm from "@/components/workshop/operations/WorkshopOperationForm";
import {
  WORKSHOP_ITEM_COL_WIDTHS,
  WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS,
  type WorkshopItemRowColWidths,
} from "./WorkshopItemConstants";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkshopItemType = "LABOR" | "PART" | "OTHER";

export interface WorkshopItemRowFieldPaths {
  type?: string;
  description: string;
  itemId?: string;
  quantity: string;
  unitPrice?: string;
  discountPct?: string;
  taxType?: string;
  total?: string; // read-only; passed from parent calculation
  notes?: string;
  isRequired?: string;
}

// Exported from WorkshopItemConstants to avoid circular dependencies
export { WORKSHOP_ITEM_COL_WIDTHS, WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS };

export interface WorkshopItemRowProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  rowErrors?: Record<string, any>;

  variant?: "financial" | "suggested";
  fieldPaths: WorkshopItemRowFieldPaths;
  colWidths: WorkshopItemRowColWidths;

  /** Override type dropdown options (defaults to LABOR / PART / OTHER) */
  typeOptions?: Array<{ label: string; value: string }>;

  /** Current type value (watched by parent to conditionally show itemId column) */
  currentType?: WorkshopItemType;
  /** Current calculated total for this row (from useServiceOrderCalculation) */
  calculatedTotal?: number;

  onRemove: () => void;
  canRemove: boolean;
  onAddRow: () => void;
  dragHandleProps: Record<string, unknown>;
  isDragging?: boolean;

  // Inventory item search (active when type is LABOR or PART)
  itemSuggestions?: any[];
  onItemSearch?: (event: AutoCompleteCompleteEvent, index?: number) => void;
  onItemSelect?: (item: any, index?: number) => void;
  selectedItemsMap?: Record<string, any>;

  autoFocus?: boolean;
  /** Whether table has catalog column (shows placeholder in OTHER rows) */
  hasCatalog?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_TYPE_OPTIONS = [
  { label: "Mano de obra", value: "LABOR" },
  { label: "Refacción", value: "PART" },
  { label: "Otro", value: "OTHER" },
];

const TAX_OPTIONS = [
  { label: "IVA (16%)", value: "IVA" },
  { label: "Exento", value: "EXEMPT" },
  { label: "Reducido (8%)", value: "REDUCED" },
];

const TYPE_TAG_CLASS: Record<WorkshopItemType, string> = {
  LABOR: "bg-blue-100 text-blue-800",
  PART: "bg-green-100 text-green-800",
  OTHER: "bg-orange-100 text-orange-800",
};

const leafKey = (path: string) => path.split(".").pop() ?? path;

const isLikelyReferenceId = (value: string) => {
  const v = value.trim();
  if (!v) return false;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    );
  const isCuid = /^c[a-z0-9]{20,}$/i.test(v);
  return isUuid || isCuid;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkshopItemRow({
  control,
  register,
  rowErrors,
  variant = "financial",
  fieldPaths,
  colWidths,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  currentType = "LABOR",
  calculatedTotal = 0,
  onRemove,
  canRemove,
  onAddRow,
  dragHandleProps,
  isDragging = false,
  itemSuggestions: externalItemSuggestions = [],
  onItemSearch,
  onItemSelect,
  selectedItemsMap = {},
  autoFocus = false,
}: WorkshopItemRowProps) {
  const [mounted, setMounted] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<any>(null);
  const [internalSuggestions, setInternalSuggestions] = useState<any[]>([]);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateOperation, setShowCreateOperation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: AutoCompleteCompleteEvent) => {
    console.log("[WorkshopItemRow] handleSearch triggered:", e.query);

    // Always use internal search (BFF endpoint) — unified catalog search, NO type filter
    if (!e.query || e.query.length < 2) {
      console.log("[WorkshopItemRow] Query too short, clearing suggestions");
      setInternalSuggestions([]);
      return;
    }

    try {
      console.log("[WorkshopItemRow] Searching catalog for:", e.query);
      const res = await catalogSearchService.search(e.query);
      console.log("[WorkshopItemRow] Search response:", res);
      // Show all results (LABOR + PART mixed) — type will be auto-detected on selection
      setInternalSuggestions(res.data || []);
      console.log("[WorkshopItemRow] Updated suggestions:", res.data);
    } catch (err) {
      console.error("[WorkshopItemRow] Search error:", err);
      setInternalSuggestions([]);
    }
  };

  const suggestionsToUse = internalSuggestions;

  useEffect(() => {
    if (autoFocus && descRef.current) {
      descRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeKey = fieldPaths.type ? leafKey(fieldPaths.type) : "";
  const descKey = leafKey(fieldPaths.description);
  const qtyKey = leafKey(fieldPaths.quantity);
  const priceKey = fieldPaths.unitPrice ? leafKey(fieldPaths.unitPrice) : "";

  const typeError = typeKey ? rowErrors?.[typeKey]?.message : undefined;
  const descError = rowErrors?.[descKey]?.message;
  const qtyError = rowErrors?.[qtyKey]?.message;
  const priceError = priceKey ? rowErrors?.[priceKey]?.message : undefined;

  /** Resolve an itemId to display text for AutoComplete */
  const resolveItem = (val: any): any => {
    if (!val) return "";
    if (typeof val !== "string") return val;
    const found =
      selectedItemsMap[val] ?? suggestionsToUse.find((s: any) => s.id === val);
    if (found) return found;
    // Keep free typing visible, but hide persisted raw IDs (uuid/cuid)
    return isLikelyReferenceId(val) ? "" : val;
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
    <div
      style={rowStyle}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
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
        />
      </div>

      {/* ── Catálogo (Código/SKU) — PRIMERA COLUMNA ── */}
      {variant !== "suggested" && fieldPaths.itemId && colWidths.itemId && (
        <div style={colWidths.itemId}>
          <Controller
            name={fieldPaths.itemId}
            control={control}
            render={({ field: f }) => (
              <AutoComplete
                value={resolveItem(f.value)}
                suggestions={suggestionsToUse}
                completeMethod={handleSearch}
                field="name"
                selectedItemTemplate={(item: any) => {
                  if (!item) return "";
                  if (typeof item === "string") return "";
                  return item.sku || item.code || item.name || "";
                }}
                placeholder="Buscar código o nombre..."
                itemTemplate={(item: any) => {
                  const isLabor = item.type === "LABOR";
                  return (
                    <div className="flex align-items-center justify-content-between gap-2 w-full">
                      <div className="flex align-items-center gap-2">
                        <i
                          className={`pi ${isLabor ? "pi-wrench" : "pi-box"}`}
                          style={{
                            fontSize: "0.7rem",
                            color: isLabor
                              ? "var(--blue-500)"
                              : "var(--green-500)",
                          }}
                        />
                        <span
                          className={`px-1 border-round text-xs font-medium ${
                            isLabor
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                          style={{ fontSize: "0.65rem" }}
                        >
                          {isLabor ? "Servicio" : "Repuesto"}
                        </span>
                        <span className="font-medium text-xs">{item.name}</span>
                        <span className="text-500 text-xs">
                          {item.sku || item.code
                            ? `(${item.sku ?? item.code})`
                            : ""}
                        </span>
                      </div>
                      <div className="flex align-items-center gap-1">
                        {item.suggestedItems?.length > 0 && (
                          <i
                            className="pi pi-link"
                            title={`Incluye ${item.suggestedItems.length} repuesto(s) sugerido(s)`}
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--orange-500)",
                            }}
                          />
                        )}
                        {item.price != null && (
                          <span className="text-primary font-medium text-xs">
                            {new Intl.NumberFormat("es-VE", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            }).format(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
                emptyMessage={
                  <div className="flex flex-column gap-2 p-3">
                    <div className="text-600 text-sm text-center">
                      No se encontraron resultados
                    </div>
                    <div className="flex gap-2">
                      <Button
                        label="Crear repuesto"
                        icon="pi pi-plus"
                        size="small"
                        className="flex-1"
                        onClick={() => setShowCreateItem(true)}
                      />
                      <Button
                        label="Crear servicio"
                        icon="pi pi-plus"
                        size="small"
                        className="flex-1"
                        onClick={() => setShowCreateOperation(true)}
                      />
                    </div>
                  </div>
                }
                className="w-full"
                inputClassName="w-full text-xs"
                inputStyle={{
                  padding: "0.2rem 0.5rem",
                  height: "30px",
                  fontSize: "0.8rem",
                }}
                style={{ height: "30px", width: "100%" }}
                onSelect={(e) => {
                  const item = e.value;
                  console.log("[WorkshopItemRow] AutoComplete onSelect:", item);
                  f.onChange(item.id);
                  if (onItemSelect) {
                    console.log(
                      "[WorkshopItemRow] Calling onItemSelect with item:",
                      item,
                    );
                    onItemSelect(item);
                  }
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
        </div>
      )}
      {/* ── Catálogo para variante suggested ── */}
      {variant === "suggested" && fieldPaths.itemId && colWidths.itemId && (
        <div style={colWidths.itemId}>
          <Controller
            name={fieldPaths.itemId}
            control={control}
            render={({ field: f }) => (
              <AutoComplete
                value={resolveItem(f.value)}
                suggestions={suggestionsToUse}
                completeMethod={handleSearch}
                field="name"
                selectedItemTemplate={(item: any) => {
                  if (!item) return "";
                  if (typeof item === "string") return "";
                  return item.sku || item.code || item.name || "";
                }}
                placeholder="Buscar código o nombre..."
                itemTemplate={(item: any) => (
                  <div className="flex align-items-center gap-2">
                    <span className="font-medium text-xs">{item.name}</span>
                    <span className="text-500 text-xs">
                      ({item.sku ?? item.code})
                    </span>
                  </div>
                )}
                className="w-full"
                inputClassName="w-full text-xs"
                inputStyle={{
                  padding: "0.2rem 0.5rem",
                  height: "30px",
                  fontSize: "0.8rem",
                }}
                style={{ height: "30px", width: "100%" }}
                emptyMessage="No se encontraron resultados"
                onSelect={(e) => {
                  const item = e.value;
                  f.onChange(item.id);
                  if (onItemSelect) onItemSelect(item);
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
        </div>
      )}

      {/* ── Tipo (read-only badge) ── */}
      {variant === "financial" && fieldPaths.type && colWidths.type && (
        <div
          style={{
            ...colWidths.type,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className={`px-2 py-1 border-round text-xs font-medium ${
              TYPE_TAG_CLASS[currentType] ?? ""
            }`}
          >
            {currentType === "LABOR"
              ? "Servicio"
              : currentType === "PART"
              ? "Repuesto"
              : "Otro"}
          </span>
        </div>
      )}

      {/* ── Descripción ── */}
      <div style={colWidths.description}>
        <Controller
          name={fieldPaths.description}
          control={control}
          render={({ field: f }) => (
            <InputText
              value={f.value ?? ""}
              onChange={(e) => f.onChange(e.target.value)}
              ref={descRef}
              placeholder={
                currentType === "PART"
                  ? "Nombre del repuesto..."
                  : currentType === "LABOR"
                  ? "Descripción del servicio..."
                  : "Descripción..."
              }
              className={`w-full ${descError ? "p-invalid" : ""}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.25rem 0.5rem",
                height: "30px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.shiftKey) {
                  // Allow natural tab flow
                }
              }}
            />
          )}
        />
        {descError && (
          <small
            className="p-error"
            style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
          >
            {descError}
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
              onValueChange={(e) => f.onChange(e.value ?? 1)}
              min={0.01}
              minFractionDigits={0}
              maxFractionDigits={2}
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

      {/* ── Precio unitario ── */}
      {variant === "financial" &&
        fieldPaths.unitPrice &&
        colWidths.unitPrice && (
          <div style={colWidths.unitPrice}>
            <Controller
              name={fieldPaths.unitPrice}
              control={control}
              render={({ field: f }) => (
                <InputNumber
                  value={f.value}
                  onValueChange={(e) => f.onChange(e.value ?? 0)}
                  min={0}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  mode="currency"
                  currency="USD"
                  locale="es-VE"
                  className="w-full"
                  inputClassName={`w-full text-right ${
                    priceError ? "p-invalid" : ""
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
            {priceError && (
              <small
                className="p-error"
                style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
              >
                {priceError}
              </small>
            )}
          </div>
        )}

      {/* ── Descuento % ── */}
      {variant === "financial" &&
        fieldPaths.discountPct &&
        colWidths.discountPct && (
          <div style={colWidths.discountPct}>
            <Controller
              name={fieldPaths.discountPct}
              control={control}
              render={({ field: f }) => (
                <InputNumber
                  value={f.value}
                  onValueChange={(e) => f.onChange(e.value ?? 0)}
                  min={0}
                  max={100}
                  suffix="%"
                  className="w-full"
                  inputClassName="w-full text-center"
                  inputStyle={{
                    padding: "0.25rem 0.4rem",
                    height: "30px",
                    fontSize: "0.8rem",
                  }}
                  style={{ height: "30px" }}
                />
              )}
            />
          </div>
        )}

      {/* ── Impuesto ── */}
      {variant === "financial" && fieldPaths.taxType && colWidths.taxType && (
        <div style={colWidths.taxType}>
          <Controller
            name={fieldPaths.taxType}
            control={control}
            render={({ field: f }) => (
              <Dropdown
                value={f.value}
                onChange={(e) => f.onChange(e.value)}
                options={TAX_OPTIONS}
                className="w-full"
                style={{
                  height: "30px",
                  fontSize: "0.8rem",
                  alignItems: "center",
                }}
                panelStyle={{ fontSize: "0.8rem" }}
              />
            )}
          />
        </div>
      )}

      {/* ── Total (read-only calculado) ── */}
      {variant === "financial" && colWidths.total && (
        <div style={colWidths.total}>
          <InputNumber
            value={calculatedTotal}
            readOnly
            mode="currency"
            currency="USD"
            locale="es-VE"
            className="w-full"
            inputClassName="w-full text-right surface-200 font-medium"
            inputStyle={{
              padding: "0.25rem 0.4rem",
              height: "30px",
              fontSize: "0.8rem",
            }}
            style={{ height: "30px" }}
          />
        </div>
      )}

      {/* ── Notas ── */}
      {variant === "suggested" && fieldPaths.notes && colWidths.notes && (
        <div style={colWidths.notes}>
          <Controller
            name={fieldPaths.notes}
            control={control}
            render={({ field: f }) => (
              <InputText
                {...f}
                value={f.value ?? ""}
                placeholder="Opcional"
                className="w-full text-xs"
                style={{
                  padding: "0.25rem 0.5rem",
                  height: "30px",
                }}
              />
            )}
          />
        </div>
      )}

      {/* ── Obligatorio ── */}
      {variant === "suggested" &&
        fieldPaths.isRequired &&
        colWidths.isRequired && (
          <div
            style={{
              ...colWidths.isRequired,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Controller
              name={fieldPaths.isRequired}
              control={control}
              render={({ field: f }) => (
                <Checkbox
                  inputId={`req-${
                    fieldPaths.isRequired?.replace(/\./g, "-") ?? ""
                  }`}
                  checked={f.value ?? false}
                  onChange={(e) => f.onChange(e.checked)}
                />
              )}
            />
          </div>
        )}

      {/* ── Eliminar ── */}
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
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          style={{ width: "28px", height: "28px" }}
          onClick={onRemove}
          disabled={!canRemove}
          tooltip="Eliminar ítem"
          tooltipOptions={{ position: "top" }}
        />
      </div>

      {/* ── Toast y Create Dialogs ── */}
      <Toast ref={toastRef} />

      {/* Item Dialog */}
      <Dialog
        visible={showCreateItem}
        onHide={() => setShowCreateItem(false)}
        header="Crear Repuesto"
        modal
        style={{ width: "90vw", maxWidth: "1000px" }}
        maximizable
      >
        <ItemForm
          model={null}
          formId="create-item-dialog"
          onSave={() => {
            setShowCreateItem(false);
            toastRef.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Repuesto creado correctamente",
              life: 3000,
            });
          }}
          toast={toastRef}
        />
      </Dialog>

      {/* Operation Dialog */}
      <Dialog
        visible={showCreateOperation}
        onHide={() => setShowCreateOperation(false)}
        header="Crear Servicio"
        modal
        style={{ width: "90vw", maxWidth: "1000px" }}
        maximizable
      >
        <WorkshopOperationForm
          operation={null}
          formId="create-operation-dialog"
          onSave={() => {
            setShowCreateOperation(false);
            toastRef.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Servicio creado correctamente",
              life: 3000,
            });
          }}
          toast={toastRef}
        />
      </Dialog>
    </div>
  );
}
