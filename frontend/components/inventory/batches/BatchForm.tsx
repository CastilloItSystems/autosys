"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import {
  Batch,
  BatchStatus,
  BATCH_STATUS_CONFIG,
} from "@/types/batch.interface";
import { createBatchSchema, CreateBatchInput } from "@/libs/zods/batchZod";

interface BatchFormProps {
  batch?: Batch | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function BatchForm({
  batch,
  onSubmit,
  onCancel,
}: BatchFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBatchInput>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: batch
      ? {
          sku: batch.sku,
          itemId: batch.itemId,
          quantity: batch.quantity,
          batchNumber: batch.batchNumber,
          manufactureDate: new Date(batch.manufactureDate),
          expiryDate: new Date(batch.expiryDate),
          warehouseId: batch.warehouseId,
          notes: batch.notes,
        }
      : undefined,
  });

  const handleFormSubmit = async (data: CreateBatchInput) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-semibold">SKU</label>
          <Controller
            name="sku"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ingrese el SKU"
                className={errors.sku ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.sku && (
            <small className="text-red-600">{errors.sku.message}</small>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold">Número de Lote</label>
          <Controller
            name="batchNumber"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ingrese el número de lote"
                className={errors.batchNumber ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.batchNumber && (
            <small className="text-red-600">{errors.batchNumber.message}</small>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold">Cantidad</label>
          <Controller
            name="quantity"
            control={control}
            render={({ field: { value, onChange } }) => (
              <InputNumber
                value={value}
                onValueChange={(e) => onChange(e.value)}
                placeholder="0"
                className={errors.quantity ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.quantity && (
            <small className="text-red-600">{errors.quantity.message}</small>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold">ID del Artículo</label>
          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="ID del artículo"
                className={errors.itemId ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.itemId && (
            <small className="text-red-600">{errors.itemId.message}</small>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Fecha de Fabricación
          </label>
          <Controller
            name="manufactureDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Calendar
                value={value ? new Date(value) : null}
                onChange={(e) => onChange(e.value)}
                dateFormat="dd/mm/yy"
                className={
                  errors.manufactureDate ? "p-invalid w-full" : "w-full"
                }
              />
            )}
          />
          {errors.manufactureDate && (
            <small className="text-red-600">
              {errors.manufactureDate.message}
            </small>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Fecha de Vencimiento
          </label>
          <Controller
            name="expiryDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Calendar
                value={value ? new Date(value) : null}
                onChange={(e) => onChange(e.value)}
                dateFormat="dd/mm/yy"
                className={errors.expiryDate ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.expiryDate && (
            <small className="text-red-600">{errors.expiryDate.message}</small>
          )}
        </div>

        <div className="col-span-2">
          <label className="block mb-2 font-semibold">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                placeholder="Ingrese las notas"
                rows={3}
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <Button
          label={batch ? "Actualizar" : "Crear"}
          type="submit"
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
