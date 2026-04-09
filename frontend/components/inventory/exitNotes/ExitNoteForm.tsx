"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { AutoCompleteCompleteEvent } from "primereact/autocomplete";

import ItemsTable from "../common/ItemsTable";
import ItemRow, { ItemRowColWidths } from "../common/ItemRow";

import {
  createExitNoteSchema,
  CreateExitNoteInput,
} from "@/libs/zods/inventory/exitNoteZod";
import {
  ExitNote,
  ExitNoteType,
  EXIT_NOTE_TYPE_CONFIG,
} from "@/libs/interfaces/inventory/exitNote.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import exitNoteService from "@/app/api/inventory/exitNoteService";
import searchService from "@/app/api/inventory/searchService";
import { handleFormError } from "@/utils/errorHandlers";

/** Column widths — shared between ItemsTable header and ItemRow cells */
const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { width: "12rem", flexShrink: 0 },
  itemName: { flex: "1 1 0", minWidth: "8rem" },
  quantity: { width: "5.5rem", flexShrink: 0 },
  location: { width: "6rem", flexShrink: 0 },
  batch: { width: "5.5rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

interface ExitNoteFormProps {
  exitNote?: ExitNote | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

export default function ExitNoteForm({
  exitNote,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  warehouses,
}: ExitNoteFormProps) {
  const isEditing = !!exitNote;
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    () => {
      if (exitNote?.items) {
        const map: Record<string, any> = {};
        for (const row of exitNote.items) {
          if (row.item) {
            map[row.itemId] = row.item;
          } else {
            const found = items.find((i) => i.id === row.itemId);
            if (found) map[row.itemId] = found;
          }
        }
        return map;
      }
      return {};
    },
  );

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateExitNoteInput>({
    resolver: zodResolver(createExitNoteSchema),
    mode: "onBlur",
    defaultValues: exitNote
      ? {
          type: exitNote.type,
          warehouseId: exitNote.warehouseId,
          preInvoiceId: exitNote.preInvoiceId || undefined,
          recipientName: exitNote.recipientName || undefined,
          recipientId: exitNote.recipientId || undefined,
          recipientPhone: exitNote.recipientPhone || undefined,
          reason: exitNote.reason || undefined,
          reference: exitNote.reference || undefined,
          expectedReturnDate: exitNote.expectedReturnDate
            ? new Date(exitNote.expectedReturnDate)
            : undefined,
          notes: exitNote.notes || undefined,
          authorizedBy: exitNote.authorizedBy || undefined,
          items: Array.isArray(exitNote.items)
            ? exitNote.items.map((i) => ({
                itemId: i.itemId,
                itemName: i.itemName || i.item?.name || "",
                quantity: i.quantity,
                pickedFromLocation: i.pickedFromLocation || undefined,
                batchId: i.batchId || undefined,
                serialNumberId: i.serialNumberId || undefined,
                notes: i.notes || undefined,
              }))
            : [{ itemId: "", itemName: "", quantity: 1 }],
        }
      : {
          type: ExitNoteType.SALE,
          items: [{ itemId: "", itemName: "", quantity: 1 }],
        },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const selectedType = watch("type");

  /* ── Options ── */
  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({ label: `${w.code} - ${w.name}`, value: w.id })),
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
      Object.values(ExitNoteType).map((t) => ({
        label: EXIT_NOTE_TYPE_CONFIG[t].label,
        value: t,
      })),
    [],
  );

  /* ── Search ── */
  const onSearchItems = useCallback(
    async (event: AutoCompleteCompleteEvent) => {
      try {
        const res = await searchService.search({
          query: event.query,
          page: 1,
          limit: 15,
          filters: { isActive: true },
        });
        setItemSuggestions(res.data || []);
      } catch (error) {
        console.error("Error searching items:", error);
        setItemSuggestions([]);
      }
    },
    [],
  );

  const itemSuggestionTemplate = useCallback(
    (item: any) => (
      <div className="flex align-items-center justify-content-between gap-2">
        <div className="flex flex-column">
          <span className="font-bold text-sm">{item.name}</span>
          <span className="text-xs text-600">
            {item.sku || item.code ? `${item.sku || item.code} - ` : ""}
            {item.categoryName || ""}
          </span>
        </div>
        <span className="font-semibold text-primary text-sm">
          ${item.salePrice}
        </span>
      </div>
    ),
    [],
  );

  /* ── Submit ── */
  const onSubmit = async (data: CreateExitNoteInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        type: data.type,
        warehouseId: data.warehouseId,
        preInvoiceId: data.preInvoiceId || undefined,
        recipientName: data.recipientName || undefined,
        recipientId: data.recipientId || undefined,
        recipientPhone: data.recipientPhone || undefined,
        reason: data.reason || undefined,
        reference: data.reference || undefined,
        expectedReturnDate: data.expectedReturnDate || undefined,
        notes: data.notes || undefined,
        authorizedBy: data.authorizedBy || undefined,
        items: data.items.map((item) => {
          const mapped: Record<string, any> = {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
          };
          if (item.pickedFromLocation)
            mapped.pickedFromLocation = item.pickedFromLocation;
          if (item.batchId) mapped.batchId = item.batchId;
          if (item.serialNumberId) mapped.serialNumberId = item.serialNumberId;
          if (item.notes) mapped.notes = item.notes;
          return mapped;
        }),
      };

      if (isEditing && exitNote) {
        await exitNoteService.update(exitNote.id, payload);
      } else {
        await exitNoteService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "exit-note-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid row-gap-2">
        {/* ══ 1. TIPO Y ALMACÉN ═══════════════════════════════════════════ */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Tipo de Salida <span className="text-red-500">*</span>
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

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Almacén de Origen <span className="text-red-500">*</span>
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
                filter
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        {/* ══ 2. CAMPOS CONDICIONALES POR TIPO ════════════════════════════ */}
        {selectedType === ExitNoteType.SALE && (
          <div className="col-12 md:col-6 field">
            <label>Pre-Factura ID</label>
            <InputText
              {...register("preInvoiceId")}
              placeholder="ID de Pre-Factura"
              className={errors.preInvoiceId ? "p-invalid" : ""}
            />
          </div>
        )}

        {selectedType === ExitNoteType.LOAN && (
          <div className="col-12 md:col-6 field">
            <label>Fecha de Retorno Esperada</label>
            <Controller
              name="expectedReturnDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  id={field.name}
                  value={field.value || null}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  minDate={new Date()}
                />
              )}
            />
          </div>
        )}

        {(selectedType === ExitNoteType.DONATION ||
          selectedType === ExitNoteType.OWNER_PICKUP) && (
          <div className="col-12 md:col-6 field">
            <label>
              Autorizado Por <span className="text-red-500">*</span>
            </label>
            <InputText
              {...register("authorizedBy")}
              placeholder="Nombre de la persona autorizante"
              className={errors.authorizedBy ? "p-invalid" : ""}
            />
          </div>
        )}

        {/* ══ 3. DESTINATARIO ══════════════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-0">
            <span className="p-tag p-tag-secondary text-xs">Destinatario</span>
          </Divider>
        </div>

        <div className="col-12 md:col-4 field">
          <label>Nombre del Destinatario</label>
          <InputText
            {...register("recipientName")}
            placeholder="Nombre completo"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Cédula / RIF</label>
          <InputText
            {...register("recipientId")}
            placeholder="Número de identificación"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Teléfono</label>
          <InputText
            {...register("recipientPhone")}
            placeholder="Número de teléfono"
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label>Motivo / Razón</label>
          <InputText
            {...register("reason")}
            placeholder="Motivo de la salida"
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label>Referencia</label>
          <InputText
            {...register("reference")}
            placeholder="Nro. orden, ticket, etc."
          />
        </div>

        {/* ══ 4. ARTÍCULOS ═════════════════════════════════════════════════ */}
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{
            itemId: "",
            itemName: "",
            quantity: 1,
          }}
          title="Productos a Salir"
          columns={[
            { label: "", style: COLS.handle },
            { label: "Producto (SKU)", style: COLS.product },
            { label: "Nombre en Registro", style: COLS.itemName! },
            { label: "Cant.", style: COLS.quantity },
            { label: "Ubicación", style: COLS.location! },
            { label: "Lote", style: COLS.batch! },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({ index, onAddRow, dragHandleProps, isDragging, autoFocus }) => (
            <ItemRow
              control={control}
              register={register}
              autoFocus={autoFocus}
              rowErrors={(errors.items as any)?.[index]}
              itemOptions={itemOptions}
              fieldPaths={{
                itemId: `items.${index}.itemId`,
                itemName: `items.${index}.itemName`,
                quantity: `items.${index}.quantity`,
                location: `items.${index}.pickedFromLocation`,
                batch: `items.${index}.batchId`,
              }}
              colWidths={COLS}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              onAddRow={onAddRow}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
              locationPlaceholder="Ej: A-12"
              batchPlaceholder="Lote"
              suggestions={itemSuggestions}
              onSearch={onSearchItems}
              itemTemplate={itemSuggestionTemplate}
              items={items}
              selectedItemsMap={selectedItemsMap}
              onItemChange={(itemId) => {
                const item =
                  itemSuggestions.find((i) => i.id === itemId) ||
                  items.find((i) => i.id === itemId);
                if (item) {
                  setSelectedItemsMap((prev) => ({
                    ...prev,
                    [itemId]: item,
                  }));
                  setValue(`items.${index}.itemName`, item.name);
                }
              }}
            />
          )}
        />

        {errors.items && typeof errors.items.message === "string" && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}

        {/* ══ 5. OBSERVACIONES ═════════════════════════════════════════════ */}
        <div className="col-12 field my-0">
          <label>Observaciones</label>
          <InputTextarea
            {...register("notes")}
            rows={3}
            autoResize
            placeholder="Notas adicionales"
          />
        </div>
      </div>
    </form>
  );
}
