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
import WorkshopItemRow, {
  WORKSHOP_ITEM_COL_WIDTHS,
  WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS,
  WorkshopItemType,
} from "./WorkshopItemRow";
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
  { label: "Tipo", style: WORKSHOP_ITEM_COL_WIDTHS.type! },
  { label: "Descripción", style: WORKSHOP_ITEM_COL_WIDTHS.description },
  { label: "Cant.", style: WORKSHOP_ITEM_COL_WIDTHS.quantity },
  { label: "P. Unit", style: WORKSHOP_ITEM_COL_WIDTHS.unitPrice! },
  { label: "Desc. %", style: WORKSHOP_ITEM_COL_WIDTHS.discountPct! },
  { label: "Imp.", style: WORKSHOP_ITEM_COL_WIDTHS.taxType! },
  { label: "Total", style: WORKSHOP_ITEM_COL_WIDTHS.total! },
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.remove },
];

/** Same columns but with the extra Catálogo column after Descripción (PART rows) */
export const WORKSHOP_ITEM_COLS_WITH_CATALOG: ColumnDef[] = [
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.handle },
  { label: "Tipo", style: WORKSHOP_ITEM_COL_WIDTHS.type! },
  { label: "Descripción", style: WORKSHOP_ITEM_COL_WIDTHS.description },
  { label: "Catálogo", style: WORKSHOP_ITEM_COL_WIDTHS.itemId! },
  { label: "Cant.", style: WORKSHOP_ITEM_COL_WIDTHS.quantity },
  { label: "P. Unit", style: WORKSHOP_ITEM_COL_WIDTHS.unitPrice! },
  { label: "Desc. %", style: WORKSHOP_ITEM_COL_WIDTHS.discountPct! },
  { label: "Imp.", style: WORKSHOP_ITEM_COL_WIDTHS.taxType! },
  { label: "Total", style: WORKSHOP_ITEM_COL_WIDTHS.total! },
  { label: "", style: WORKSHOP_ITEM_COL_WIDTHS.remove },
];

export const WORKSHOP_SUGGESTED_ITEM_COLS: ColumnDef[] = [
  { label: "", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.handle },
  { label: "Catálogo", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.itemId! },
  { label: "Descripción", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.description },
  { label: "Cant.", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.quantity },
  { label: "Notas", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.notes! },
  { label: "Oblig.", style: WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS.isRequired! },
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
  onItemSearch?: (
    event: AutoCompleteCompleteEvent,
    type: WorkshopItemType,
    index: number,
  ) => void;
  onItemSelect?: (item: any, index: number) => void;
  selectedItemsMap?: Record<string, any>;

  title?: string;
  disabled?: boolean;
  /** Whether any row has type!==OTHER (drives extra Catálogo column header) */
  hasCatalog?: boolean;
  /** Override type dropdown options passed to each WorkshopItemRow */
  typeOptions?: Array<{ label: string; value: string }>;
  /** Override the default empty item appended when user clicks + */
  defaultItem?: Record<string, unknown>;
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
  hasCatalog = false,
  typeOptions,
  defaultItem: defaultItemProp,
}: WorkshopItemsTableProps) {
  const columns =
    variant === "suggested"
      ? WORKSHOP_SUGGESTED_ITEM_COLS
      : hasCatalog
      ? WORKSHOP_ITEM_COLS_WITH_CATALOG
      : WORKSHOP_ITEM_COLS;
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
      minWidth={variant === "suggested" ? 600 : hasCatalog ? 860 : 760}
      renderRow={({
        field,
        index,
        onAddRow,
        dragHandleProps,
        isDragging,
        autoFocus,
      }) => {
        const currentType = variant === "suggested" ? "PART" : watchedTypes[index] ?? "LABOR";
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
                itemId: `${fieldArrayName}.${index}.itemId`,
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
            onItemSearch={(e, type) => onItemSearch?.(e, type, index)}
            onItemSelect={(item) => onItemSelect?.(item, index)}
            selectedItemsMap={selectedItemsMap}
            autoFocus={autoFocus}
          />
        );
      }}
    />
  );
}
