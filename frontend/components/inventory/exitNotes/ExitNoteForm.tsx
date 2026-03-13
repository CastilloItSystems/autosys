"use client";
import React, { useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

import {
  createExitNoteSchema,
  CreateExitNoteInput,
} from "@/libs/zods/inventory/exitNoteZod";
import {
  ExitNote,
  ExitNoteType,
  EXIT_NOTE_TYPE_CONFIG,
  CreateExitNote,
} from "@/libs/interfaces/inventory/exitNote.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import exitNoteService from "@/app/api/inventory/exitNoteService";
import { handleFormError } from "@/utils/errorHandlers";

interface ExitNoteFormProps {
  exitNote?: ExitNote | null;
  exitNotes: ExitNote[];
  setExitNotes: (notes: ExitNote[]) => void;
  hideFormDialog: () => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

export default function ExitNoteForm({
  exitNote,
  exitNotes,
  setExitNotes,
  hideFormDialog,
  showToast,
  toast,
  items,
  warehouses,
}: ExitNoteFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<CreateExitNoteInput>({
    resolver: zodResolver(createExitNoteSchema),
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
                quantity: i.quantity,
                pickedFromLocation: i.pickedFromLocation || undefined,
                batchId: i.batchId || undefined,
                serialNumberId: i.serialNumberId || undefined,
                notes: i.notes || undefined,
              }))
            : [{ itemId: "", quantity: 1 }],
        }
      : {
          type: ExitNoteType.SALE,
          items: [{ itemId: "", quantity: 1 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedType = watch("type");

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: w.name,
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
      Object.values(ExitNoteType).map((t) => ({
        label: EXIT_NOTE_TYPE_CONFIG[t].label,
        value: t,
      })),
    [],
  );

  const onSubmit = async (data: CreateExitNoteInput) => {
    setSubmitting(true);
    try {
      // Clean up null values to undefined for compatibility
      const cleanedData: CreateExitNote = {
        ...data,
        expectedReturnDate: data.expectedReturnDate || undefined,
      } as CreateExitNote;

      if (exitNote) {
        const result = await exitNoteService.update(exitNote.id, cleanedData);
        setExitNotes(
          exitNotes.map((note) =>
            note.id === result.data.id ? result.data : note,
          ),
        );
        showToast("success", "Éxito", "Nota de Salida actualizada");
      } else {
        const result = await exitNoteService.create(cleanedData);
        setExitNotes([result.data, ...exitNotes]);
        showToast("success", "Éxito", "Nota de Salida creada");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Type and Warehouse Selection */}
        <div className="col-12 md:col-6 field">
          <label className="font-bold">Tipo de Salida</label>
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
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-bold">Almacén de Origen</label>
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

        {/* Conditional Fields Based on Type */}
        {selectedType === ExitNoteType.SALE && (
          <div className="col-12 field">
            <label>Pre-Factura ID</label>
            <InputText
              {...register("preInvoiceId")}
              placeholder="ID de Pre-Factura"
              className={errors.preInvoiceId ? "p-invalid" : ""}
            />
            {errors.preInvoiceId && (
              <small className="p-error">{errors.preInvoiceId.message}</small>
            )}
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
                  className={errors.expectedReturnDate ? "p-invalid" : ""}
                />
              )}
            />
            {errors.expectedReturnDate && (
              <small className="p-error">
                {errors.expectedReturnDate.message}
              </small>
            )}
          </div>
        )}

        {(selectedType === ExitNoteType.DONATION ||
          selectedType === ExitNoteType.OWNER_PICKUP) && (
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

        {/* Recipient Information */}
        <div className="col-12">
          <Divider align="left">
            <span className="p-tag">Información del Destinatario</span>
          </Divider>
        </div>

        <div className="col-12 md:col-6 field">
          <label>Nombre del Destinatario</label>
          <InputText
            {...register("recipientName")}
            placeholder="Nombre completo"
            className={errors.recipientName ? "p-invalid" : ""}
          />
          {errors.recipientName && (
            <small className="p-error">{errors.recipientName.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label>Cédula / ID</label>
          <InputText
            {...register("recipientId")}
            placeholder="Número de identificación"
            className={errors.recipientId ? "p-invalid" : ""}
          />
          {errors.recipientId && (
            <small className="p-error">{errors.recipientId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label>Teléfono</label>
          <InputText
            {...register("recipientPhone")}
            placeholder="Número de teléfono"
            className={errors.recipientPhone ? "p-invalid" : ""}
          />
          {errors.recipientPhone && (
            <small className="p-error">{errors.recipientPhone.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label>Motivo/Razón</label>
          <InputText
            {...register("reason")}
            placeholder="Motivo de la salida"
            className={errors.reason ? "p-invalid" : ""}
          />
          {errors.reason && (
            <small className="p-error">{errors.reason.message}</small>
          )}
        </div>

        {/* Reference Field */}
        <div className="col-12 field">
          <label>Referencia / Observación</label>
          <InputTextarea
            {...register("reference")}
            placeholder="Referencia adicional"
            rows={2}
            autoResize
            className={errors.reference ? "p-invalid" : ""}
          />
          {errors.reference && (
            <small className="p-error">{errors.reference.message}</small>
          )}
        </div>

        {/* Items Section */}
        <div className="col-12">
          <Divider align="left">
            <div className="flex align-items-center gap-2">
              <span className="p-tag">Productos a Salir</span>
              <Button
                type="button"
                icon="pi pi-plus"
                className="p-button-rounded p-button-text p-button-sm"
                onClick={() => append({ itemId: "", quantity: 1 })}
              />
            </div>
          </Divider>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="col-12 grid align-items-end surface-50 p-2 border-round mb-2"
          >
            <div className="col-12 md:col-5 field mb-0">
              <label className="text-sm">Producto</label>
              <Controller
                name={`items.${index}.itemId`}
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={itemOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione Producto"
                    filter
                    className={errors.items?.[index]?.itemId ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.items?.[index]?.itemId && (
                <small className="p-error block">
                  {errors.items[index]?.itemId?.message}
                </small>
              )}
            </div>

            <div className="col-6 md:col-2 field mb-0">
              <label className="text-sm">Cantidad</label>
              <Controller
                name={`items.${index}.quantity`}
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={1}
                    showButtons
                    className={
                      errors.items?.[index]?.quantity ? "p-invalid" : ""
                    }
                  />
                )}
              />
            </div>

            <div className="col-6 md:col-3 field mb-0">
              <label className="text-sm">Ubicación (Opt.)</label>
              <InputText
                {...register(`items.${index}.pickedFromLocation` as any)}
                placeholder="Ej: A-12"
              />
            </div>

            <div className="col-1 md:col-2 flex justify-content-end mb-1">
              <Button
                type="button"
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-text"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              />
            </div>
          </div>
        ))}

        {errors.items && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}

        {/* General Notes */}
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

        {/* Form Actions */}
        <div className="col-12 flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={hideFormDialog}
            type="button"
          />
          <Button
            label={exitNote ? "Actualizar" : "Crear Nota"}
            icon="pi pi-check"
            loading={submitting}
            type="submit"
          />
        </div>
      </div>
    </form>
  );
}
