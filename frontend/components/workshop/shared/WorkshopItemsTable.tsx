"use client";
import React from "react";
import {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayMove,
  Control,
  UseFormRegister,
} from "react-hook-form";
import ItemsTable, { ColumnDef } from "../../inventory/common/ItemsTable";
import WorkshopItemRow, { type WorkshopItemType } from "./WorkshopItemRow";
import {
  WORKSHOP_ITEM_COL_WIDTHS,
  WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS,
} from "./WorkshopItemConstants";
import type { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import type { WorkshopCalculationResult } from "../../../hooks/useServiceOrderCalculation";

// ── Default workshop item ─────────────────────────────────────────────────────

export const DEFAULT_WORKSHOP_ITEM: Record<string, unknown> = {
  type: "LABOR",
  description: "",
  itemId: "",
  quantity: 1,
  unitPrice: 0,
  unitCost: 0,
  discountPct: 0,
  taxType: "IVA",
  taxRate: 0.16,
};

export const DEFAULT_SUGGESTED_ITEM: Record<string, unknown> = {
  itemId: null,
  description: "",
  quantity: 1,
  notes: "",
  isRequired: false,
};

// ── Column header definitions ─────────────────────────────────────────────────

export const WORKSHOP_ITEM_COLS: ColumnDef[] = [
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.handle },
  { label: "Código", style: WORKSHOP_ITEM_COL_WIDTHS.itemId! }, // PRIMERO
  { label: "Tipo", style: WORKSHOP_ITEM_COL_WIDTHS.type! }, // SEGUNDO
  { label: "Descripción", style: WORKSHOP_ITEM_COL_WIDTHS.description },
  {
    label: "Cant.",
    style: WORKSHOP_ITEM_COL_WIDTHS.quantity,
    headerAlign: "center",
  },
  {
    label: "P. Unit",
    style: WORKSHOP_ITEM_COL_WIDTHS.unitPrice!,
    headerAlign: "right",
  },
  {
    label: "Desc. %",
    style: WORKSHOP_ITEM_COL_WIDTHS.discountPct!,
    headerAlign: "center",
  },
  { label: "Imp.", style: WORKSHOP_ITEM_COL_WIDTHS.taxType! },
  {
    label: "Total",
    style: WORKSHOP_ITEM_COL_WIDTHS.total!,
    headerAlign: "right",
  },
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.remove },
];

/** Variante con catálogo — DEPRECATED (ya no es necesaria, siempre mostrar catálogo como primera columna) */
export const WORKSHOP_ITEM_COLS_WITH_CATALOG: ColumnDef[] = [
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.handle },
  { label: "Código", style: WORKSHOP_ITEM_COL_WIDTHS.itemId! },
  { label: "Tipo", style: WORKSHOP_ITEM_COL_WIDTHS.type! },
  { label: "Descripción", style: WORKSHOP_ITEM_COL_WIDTHS.description },
  {
    label: "Cant.",
    style: WORKSHOP_ITEM_COL_WIDTHS.quantity,
    headerAlign: "center",
  },
  {
    label: "P. Unit",
    style: WORKSHOP_ITEM_COL_WIDTHS.unitPrice!,
    headerAlign: "right",
  },
  {
    label: "Desc. %",
    style: WORKSHOP_ITEM_COL_WIDTHS.discountPct!,
    headerAlign: "center",
  },
  { label: "Imp.", style: WORKSHOP_ITEM_COL_WIDTHS.taxType! },
  {
    label: "Total",
    style: WORKSHOP_ITEM_COL_WIDTHS.total!,
    headerAlign: "right",
  },
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.remove },
];

export const WORKSHOP_SUGGESTED_ITEM_COLS: ColumnDef[] = [
  { label: "", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.handle },
  { label: "Código", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.itemId! }, // PRIMERO
  {
    label: "Descripción",
    style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.description,
  },
  {
    label: "Cant.",
    style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.quantity,
    headerAlign: "center",
  },
  { label: "Notas", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.notes! },
  {
    label: "Oblig.",
    style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.isRequired!,
    headerAlign: "center",
  },
  { label: "", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.remove },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface WorkshopItemsTableProps {
  variant?: "financial" | "suggested";
  control: Control<any>;
  register: UseFormRegister<any>;
  fields: FieldArrayWithId<any, any, "id">[];
  append: UseFieldArrayAppend<any, any>;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  errors?: Record<string, any>;

  /** Field array name, e.g. "items" */
  fieldArrayName: string;

  /** Calculation results from useServiceOrderCalculation */
  calcResult?: WorkshopCalculationResult;

  /** Watched `type` values (index-aligned with fields) */
  watchedTypes?: WorkshopItemType[];

  // Inventory item search
  itemSuggestions?: any[];
  onItemSearch?: (event: AutoCompleteCompleteEvent, index: number) => void;
  onItemSelect?: (item: any, index: number) => void;
  selectedItemsMap?: Record<string, any>;

  title?: string;
  disabled?: boolean;
  /** Override type dropdown options passed to each WorkshopItemRow */
  typeOptions?: Array<{ label: string; value: string }>;
  /** Override the default empty item appended when user clicks + */
  defaultItem?: Record<string, unknown>;
  /** Name of the catalog reference field in the form schema (default: "itemId") */
  catalogRefField?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkshopItemsTable({
  variant = "financial",
  control,
  register,
  fields,
  append,
  remove,
  move,
  errors,
  fieldArrayName,
  calcResult,
  watchedTypes = [],
  itemSuggestions = [],
  onItemSearch,
  onItemSelect,
  selectedItemsMap = {},
  title = "Ítems",
  disabled = false,
  typeOptions,
  defaultItem: defaultItemProp,
  catalogRefField = "itemId",
}: WorkshopItemsTableProps) {
  const columns =
    variant === "suggested" ? WORKSHOP_SUGGESTED_ITEM_COLS : WORKSHOP_ITEM_COLS; // Always use standard layout — catalog is always first column
  const resolvedDefaultItem =
    defaultItemProp ??
    (variant === "suggested" ? DEFAULT_SUGGESTED_ITEM : DEFAULT_WORKSHOP_ITEM);

  return (
    <ItemsTable
      fields={fields}
      append={append}
      remove={remove}
      move={move}
      defaultItem={resolvedDefaultItem}
      columns={columns}
      title={title}
      disabled={disabled}
      minWidth={variant === "suggested" ? 600 : 900} // Slightly wider for new layout
      renderRow={({
        field,
        index,
        onAddRow,
        dragHandleProps,
        isDragging,
        autoFocus,
      }) => {
        const currentType =
          variant === "suggested" ? "PART" : watchedTypes[index] ?? "LABOR";
        const rowErrors = errors?.[fieldArrayName]?.[index];
        const rowCalc = calcResult?.items[index];

        const fieldPaths =
          variant === "suggested"
            ? {
                itemId: `${fieldArrayName}.${index}.itemId`,
                description: `${fieldArrayName}.${index}.description`,
                quantity: `${fieldArrayName}.${index}.quantity`,
                notes: `${fieldArrayName}.${index}.notes`,
                isRequired: `${fieldArrayName}.${index}.isRequired`,
              }
            : {
                type: `${fieldArrayName}.${index}.type`,
                description: `${fieldArrayName}.${index}.description`,
                itemId: `${fieldArrayName}.${index}.${catalogRefField}`,
                quantity: `${fieldArrayName}.${index}.quantity`,
                unitPrice: `${fieldArrayName}.${index}.unitPrice`,
                discountPct: `${fieldArrayName}.${index}.discountPct`,
                taxType: `${fieldArrayName}.${index}.taxType`,
              };

        const colWidths =
          variant === "suggested"
            ? WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS
            : WORKSHOP_ITEM_COL_WIDTHS;

        return (
          <WorkshopItemRow
            variant={variant}
            control={control}
            register={register}
            rowErrors={rowErrors}
            fieldPaths={fieldPaths as any}
            colWidths={colWidths}
            typeOptions={typeOptions}
            currentType={currentType as WorkshopItemType}
            calculatedTotal={rowCalc?.totalLine ?? 0}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
            onAddRow={onAddRow}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            itemSuggestions={itemSuggestions}
            onItemSearch={(e) => onItemSearch?.(e, index)}
            onItemSelect={(item) => onItemSelect?.(item, index)}
            selectedItemsMap={selectedItemsMap}
            autoFocus={autoFocus}
          />
        );
      }}
    />
  );
}
