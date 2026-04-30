"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import {
  SerialNumber,
  SerialStatus,
  SERIAL_STATUS_CONFIG,
} from "@/types/serialNumber.interface";
import {
  createSerialNumberSchema,
  CreateSerialNumberInput,
} from "@/libs/zods/serialNumberZod";

interface SerialNumberFormProps {
  serial?: SerialNumber | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function SerialNumberForm({
  serial,
  onSubmit,
  onCancel,
}: SerialNumberFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateSerialNumberInput>({
    resolver: zodResolver(createSerialNumberSchema),
    defaultValues: serial
      ? {
          serialNumber: serial.serialNumber,
          sku: serial.sku,
          itemId: serial.itemId,
          warehouseId: serial.warehouseId,
          batchId: serial.batchId,
          purchaseOrderNumber: serial.purchaseOrderNumber,
          location: serial.location,
          notes: serial.notes,
        }
      : undefined,
  });

  const handleFormSubmit = async (data: CreateSerialNumberInput) => {
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
          <label className="block mb-2 font-semibold">Número de Serie</label>
          <Controller
            name="serialNumber"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ingrese el número de serie"
                disabled={!!serial}
                className={errors.serialNumber ? "p-invalid w-full" : "w-full"}
              />
            )}
          />
          {errors.serialNumber && (
            <small className="text-red-600">
              {errors.serialNumber.message}
            </small>
          )}
        </div>

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
          <label className="block mb-2 font-semibold">Almacén</label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="ID del almacén"
                className="w-full"
              />
            )}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Lote</label>
          <Controller
            name="batchId"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="ID del lote"
                className="w-full"
              />
            )}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Número de Orden de Compra
          </label>
          <Controller
            name="purchaseOrderNumber"
            control={control}
            render={({ field }) => (
              <InputText {...field} placeholder="PO#" className="w-full" />
            )}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Ubicación</label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ubicación"
                className="w-full"
              />
            )}
          />
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
          label={serial ? "Actualizar" : "Crear"}
          type="submit"
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
