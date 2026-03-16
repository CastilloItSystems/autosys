"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import ItemsTable from "../common/ItemsTable";
import ItemRow, { ItemRowColWidths } from "../common/ItemRow";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

/** Column widths — shared between the ItemsTable header and each ItemRow cell */
const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { flex: "1 1 0", minWidth: 0 },
  quantity: { width: "5.5rem", flexShrink: 0 },
  unitCost: { width: "8rem", flexShrink: 0 },
  location: { width: "6rem", flexShrink: 0 },
  batch: { width: "5.5rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

import {
  createEntryNoteSchema,
  CreateEntryNoteInput,
} from "@/libs/zods/inventory/entryNoteZod";
import type {
  EntryNote,
  EntryType,
} from "@/libs/interfaces/inventory/entryNote.interface";
import { ENTRY_TYPE_LABELS } from "@/libs/interfaces/inventory/entryNote.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import entryNoteService, {
  CreateEntryNotePayload,
} from "@/app/api/inventory/entryNoteService";
import { handleFormError } from "@/utils/errorHandlers";

interface EntryNoteFormProps {
  entryNote?: EntryNote | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

export default function EntryNoteForm({
  entryNote,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  warehouses,
}: EntryNoteFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!entryNote;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<CreateEntryNoteInput>({
    resolver: zodResolver(createEntryNoteSchema),
    mode: "onBlur",
    defaultValues: entryNote
      ? {
          type: entryNote.type as EntryType,
          warehouseId: entryNote.warehouseId,
          purchaseOrderId: entryNote.purchaseOrderId || undefined,
          supplierName: entryNote.supplierName || undefined,
          supplierId: entryNote.supplierId || undefined,
          supplierPhone: entryNote.supplierPhone || undefined,
          reason: entryNote.reason || undefined,
          reference: entryNote.reference || undefined,
          notes: entryNote.notes || undefined,
          receivedBy: entryNote.receivedBy || undefined,
          authorizedBy: entryNote.authorizedBy || undefined,
          items: Array.isArray(entryNote.items)
            ? entryNote.items.map((i) => ({
                itemId: i.itemId,
                quantityReceived: i.quantityReceived,
                unitCost: Number(i.unitCost),
                storedToLocation: i.storedToLocation || undefined,
                batchNumber: i.batchNumber || undefined,
                notes: i.notes || undefined,
              }))
            : [{ itemId: "", quantityReceived: 1, unitCost: 0 }],
        }
      : {
          type: "TRANSFER" as EntryType,
          items: [{ itemId: "", quantityReceived: 1, unitCost: 0 }],
        },
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "items",
  });

  const selectedType = watch("type");

  // When type changes, reset items
  useEffect(() => {
    if (isEditing) return;
    replace([{ itemId: "", quantityReceived: 1, unitCost: 0 }]);
  }, [selectedType, isEditing, replace]);

  /* ── Options ── */
  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: `${w.code} - ${w.name}`,
        value: w.id,
      })),
    [warehouses],
  );

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: i.sku || i.code ? `${i.sku || i.code} - ${i.name}` : i.name,
        value: i.id,
      })),
    [items],
  );

  const typeOptions = useMemo(
    () =>
      (Object.keys(ENTRY_TYPE_LABELS) as EntryType[]).map((t) => ({
        label: ENTRY_TYPE_LABELS[t],
        value: t,
      })),
    [],
  );

  /** Get item name from items array */
  const getItemName = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      return item
        ? item.sku || item.code
          ? `${item.sku || item.code} - ${item.name}`
          : item.name
        : "";
    },
    [items],
  );

  /* ── Totals (optional footer) ── */
  const watchedItems = watch("items");
  const subtotal =
    watchedItems?.reduce(
      (acc, it) => acc + (it.quantityReceived ?? 0) * (it.unitCost ?? 0),
      0,
    ) ?? 0;
  const totalsLines =
    subtotal > 0
      ? [{ label: "Subtotal", value: subtotal, highlight: true }]
      : undefined;

  /* ── Submit ── */
  const onSubmit = async (data: CreateEntryNoteInput) => {
    setSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (isEditing) {
        // Update: only header fields
        const { items: _, ...headerData } = data;
        await entryNoteService.update(entryNote!.id, headerData);
      } else {
        // ── Create EntryNote + add items ──
        const { items: itemsData, ...headerData } = data;

        const payload: CreateEntryNotePayload = {
          ...headerData,
          type: headerData.type as EntryType,
          purchaseOrderId: null,
          supplierName: headerData.supplierName || null,
          supplierId: headerData.supplierId || null,
          supplierPhone: headerData.supplierPhone || null,
          reason: headerData.reason || null,
          reference: headerData.reference || null,
          notes: headerData.notes || null,
          receivedBy: headerData.receivedBy || null,
          authorizedBy: headerData.authorizedBy || null,
        };

        const result = await entryNoteService.create(payload);
        const createdNote = result.data;

        for (const item of itemsData) {
          await entryNoteService.addItem(createdNote.id, {
            itemId: item.itemId,
            quantityReceived: item.quantityReceived,
            unitCost: item.unitCost,
            storedToLocation: item.storedToLocation || null,
            batchNumber: item.batchNumber || null,
            expiryDate: null,
            notes: item.notes || null,
          });
        }
      }

      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "entry-note-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ══ 1. ENCABEZADO ═══════════════════════════════════════════════ */}
        <div className="col-12 md:col-4 field">
          <label className="font-semibold">
            Tipo de Entrada <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={typeOptions}
                optionLabel="label"
                optionValue="value"
                className={errors.type ? "p-invalid" : ""}
                disabled={isEditing}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">
            Almacén Destino <span className="text-red-500">*</span>
          </label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label>Referencia</label>
          <InputText
            {...register("reference")}
            placeholder="Nro. factura, guía, OC, etc."
          />
        </div>

        {/* ══ 2. RECEPCIÓN ════════════════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-0">
            <span className="p-tag p-tag-secondary text-xs">Recepción</span>
          </Divider>
        </div>

        <div className="col-12 md:col-4 field">
          <label>Recibido Por</label>
          <InputText
            {...register("receivedBy")}
            placeholder="Nombre de quien recibe"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Motivo / Razón</label>
          <InputText
            {...register("reason")}
            placeholder="Motivo de la entrada"
          />
        </div>

        {(selectedType === "DONATION" || selectedType === "SAMPLE") && (
          <div className="col-12 md:col-4 field">
            <label>
              Autorizado Por <span className="text-red-500">*</span>
            </label>
            <InputText
              {...register("authorizedBy")}
              placeholder="Nombre de quien autoriza"
              className={errors.authorizedBy ? "p-invalid" : ""}
            />
            {errors.authorizedBy && (
              <small className="p-error">{errors.authorizedBy.message}</small>
            )}
          </div>
        )}

        {/* ══ 3. PROVEEDOR / ORIGEN ═══════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-0">
            <span className="p-tag p-tag-secondary text-xs">
              Proveedor / Origen
            </span>
          </Divider>
        </div>

        <div className="col-12 md:col-4 field">
          <label>Nombre</label>
          <InputText
            {...register("supplierName")}
            placeholder="Nombre o razón social"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>RIF / ID</label>
          <InputText {...register("supplierId")} placeholder="J-00000000-0" />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Teléfono</label>
          <InputText
            {...register("supplierPhone")}
            placeholder="0412-0000000"
          />
        </div>

        {/* ── 4. ARTÍCULOS ──────────────────────────────────────────────────── */}
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{ itemId: "", quantityReceived: 1, unitCost: 0 }}
          title="Artículos a Recibir"
          totals={totalsLines}
          columns={[
            { label: "", style: COLS.handle },
            { label: "Producto", style: COLS.product },
            { label: "Cant.", style: COLS.quantity },
            { label: "Costo Unit.", style: COLS.unitCost! },
            { label: "Ubicación", style: COLS.location! },
            { label: "Lote", style: COLS.batch! },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({ index, onAddRow, dragHandleProps, isDragging }) => (
            <ItemRow
              control={control}
              register={register}
              rowErrors={(errors.items as any)?.[index]}
              itemOptions={itemOptions}
              fieldPaths={{
                itemId: `items.${index}.itemId`,
                quantity: `items.${index}.quantityReceived`,
                unitCost: `items.${index}.unitCost`,
                location: `items.${index}.storedToLocation`,
                batch: `items.${index}.batchNumber`,
              }}
              colWidths={COLS}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              onAddRow={onAddRow}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
              locationPlaceholder="Ej: A-12"
            />
          )}
        />

        {errors.items && typeof errors.items.message === "string" && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}

        {/* ── 5. OBSERVACIONES ─────────────────────────────────────────────── */}
        <div className="col-12 field my-0">
          <label>Observaciones</label>
          <InputTextarea
            {...register("notes")}
            rows={3}
            autoResize
            placeholder="Notas adicionales"
            className={errors.notes ? "p-invalid" : ""}
          />
          {errors.notes && (
            <small className="p-error">{errors.notes.message}</small>
          )}
        </div>

        {/* NOTE: Action buttons are rendered by the parent Dialog footer (per list/form standard) */}
      </div>
    </form>
  );
}
