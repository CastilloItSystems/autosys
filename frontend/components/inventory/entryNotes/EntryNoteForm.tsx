"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";

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
    setValue,
    reset,
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

  const { fields, append, remove, replace } = useFieldArray({
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
        label: i.sku ? `${i.sku} - ${i.name}` : i.name,
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
      return item ? (item.sku ? `${item.sku} - ${item.name}` : item.name) : "";
    },
    [items],
  );

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
        {/* ── Tipo y Almacén ── */}
        <div className="col-12 md:col-6 field">
          <label className="font-bold">
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

        {/* ── Warehouse ── */}
        <div className="col-12 md:col-6 field">
          <label className="font-bold">
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
                placeholder="Seleccione Almacén"
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        {/* ── Authorization (for DONATION/SAMPLE) ── */}
        {(selectedType === "DONATION" || selectedType === "SAMPLE") && (
          <div className="col-12 md:col-6 field">
            <label>Autorizado Por</label>
            <InputText
              {...register("authorizedBy")}
              placeholder="Nombre de la persona autorizante"
              className={errors.authorizedBy ? "p-invalid" : ""}
            />
            {errors.authorizedBy && (
              <small className="p-error">{errors.authorizedBy.message}</small>
            )}
          </div>
        )}

        {/* ── Supplier info ── */}
        <>
          <div className="col-12">
            <Divider align="left">
              <span className="p-tag">Información del Proveedor / Origen</span>
            </Divider>
          </div>

          <div className="col-12 md:col-4 field">
            <label>Nombre</label>
            <InputText
              {...register("supplierName")}
              placeholder="Nombre completo"
            />
          </div>

          <div className="col-12 md:col-4 field">
            <label>RIF / ID</label>
            <InputText
              {...register("supplierId")}
              placeholder="Identificación"
            />
          </div>

          <div className="col-12 md:col-4 field">
            <label>Teléfono</label>
            <InputText {...register("supplierPhone")} placeholder="Teléfono" />
          </div>
        </>

        {/* ── Common fields ── */}
        <div className="col-12 md:col-4 field">
          <label>Recibido Por</label>
          <InputText
            {...register("receivedBy")}
            placeholder="Persona que recibe"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Motivo / Razón</label>
          <InputText
            {...register("reason")}
            placeholder="Motivo de la entrada"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Referencia</label>
          <InputText
            {...register("reference")}
            placeholder="Referencia adicional"
          />
        </div>

        {/* ── Items Section ── */}
        <div className="col-12">
          <Divider align="left">
            <div className="flex align-items-center gap-2">
              <span className="p-tag">Artículos a Recibir</span>
              <Button
                type="button"
                icon="pi pi-plus"
                className="p-button-rounded p-button-text p-button-sm"
                onClick={() =>
                  append({ itemId: "", quantityReceived: 1, unitCost: 0 })
                }
              />
            </div>
          </Divider>
        </div>

        {/* ── Items rows ── */}
        {fields.map((field, index) => {
          const watchedQty = watch(`items.${index}.quantityReceived`);

          return (
            <div
              key={field.id}
              className="col-12 grid align-items-end p-2 border-round mb-2 surface-50"
            >
              {/* Producto */}
              <div className="col-12 md:col-4 field mb-0">
                <label className="text-sm">Producto</label>
                <Controller
                  name={`items.${index}.itemId`}
                  control={control}
                  render={({ field: f }) => (
                    <Dropdown
                      value={f.value}
                      onChange={(e) => f.onChange(e.value)}
                      options={itemOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione Producto"
                      filter
                      className={
                        errors.items?.[index]?.itemId ? "p-invalid" : ""
                      }
                    />
                  )}
                />
                {errors.items?.[index]?.itemId && (
                  <small className="p-error block">
                    {errors.items[index]?.itemId?.message}
                  </small>
                )}
              </div>

              {/* Cantidad */}
              <div className="col-6 md:col-2 field mb-0">
                <label className="text-sm">Cantidad</label>
                <Controller
                  name={`items.${index}.quantityReceived`}
                  control={control}
                  render={({ field: f }) => (
                    <InputNumber
                      value={f.value}
                      onValueChange={(e) => f.onChange(e.value)}
                      min={1}
                      showButtons
                      className={
                        errors.items?.[index]?.quantityReceived
                          ? "p-invalid"
                          : ""
                      }
                    />
                  )}
                />
                {errors.items?.[index]?.quantityReceived && (
                  <small className="p-error block">
                    {errors.items[index]?.quantityReceived?.message}
                  </small>
                )}
              </div>

              {/* Costo Unitario */}
              <div className="col-6 md:col-2 field mb-0">
                <label className="text-sm">Costo Unit.</label>
                <Controller
                  name={`items.${index}.unitCost`}
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
                      className={
                        errors.items?.[index]?.unitCost ? "p-invalid" : ""
                      }
                    />
                  )}
                />
                {errors.items?.[index]?.unitCost && (
                  <small className="p-error block">
                    {errors.items[index]?.unitCost?.message}
                  </small>
                )}
              </div>

              {/* Ubicación */}
              <div className="col-6 md:col-2 field mb-0">
                <label className="text-sm">Ubicación</label>
                <InputText
                  {...register(`items.${index}.storedToLocation` as any)}
                  placeholder="Ej: A-12"
                />
              </div>

              {/* Lote */}
              <div className="col-6 md:col-1 field mb-0">
                <label className="text-sm">Lote</label>
                <InputText
                  {...register(`items.${index}.batchNumber` as any)}
                  placeholder="Lote"
                />
              </div>

              {/* Eliminar */}
              <div className="col-12 md:col-1 flex justify-content-end mb-1">
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger p-button-text"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                />
              </div>
            </div>
          );
        })}

        {errors.items && typeof errors.items.message === "string" && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}

        {/* ── Notas Generales ── */}
        <div className="col-12 field mt-3">
          <label>Notas Generales</label>
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
