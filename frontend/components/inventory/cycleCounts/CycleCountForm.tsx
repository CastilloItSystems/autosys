"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";

import {
  createCycleCount,
  updateCycleCount,
  CycleCount,
} from "../../../app/api/inventory/cycleCountService";
import { getActiveItems } from "../../../app/api/inventory/itemService";
import { Warehouse } from "../../../app/api/inventory/warehouseService";
import {
  createCycleCountSchema,
  CreateCycleCountInput,
} from "../../../libs/zods/inventory/cycleCountZod";
import { handleFormError } from "../../../utils/errorHandlers";

interface CycleCountFormProps {
  cycleCount?: CycleCount;
  warehouses: Warehouse[];
  onSuccess: () => void;
}

export default function CycleCountForm({
  cycleCount,
  warehouses,
  onSuccess,
}: CycleCountFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCycleCountInput>({
    resolver: zodResolver(createCycleCountSchema),
    defaultValues: {
      warehouseId: cycleCount?.warehouseId || "",
      items: cycleCount?.items || [{ itemId: "", expectedQuantity: 0 }],
      notes: cycleCount?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await getActiveItems();
        setItems(response.data || []);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar artículos",
          life: 3000,
        });
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (data: CreateCycleCountInput) => {
    try {
      setIsSubmitting(true);
      if (cycleCount) {
        await updateCycleCount(cycleCount.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Conteo actualizado",
          life: 3000,
        });
      } else {
        await createCycleCount(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Conteo creado",
          life: 3000,
        });
      }
      onSuccess();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemOptions = items.map((item) => ({
    label: item.sku ? `${item.sku} - ${item.name}` : item.name,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  if (initialLoading) {
    return <ProgressSpinner />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Toast ref={toast} />

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Almacén *
        </label>
        <Controller
          name="warehouseId"
          control={control}
          render={({ field }) => (
            <>
              <Dropdown
                {...field}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className="w-full"
              />
              {errors.warehouseId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.warehouseId.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <Divider />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="font-semibold text-gray-700">
            Artículos a Contar *
          </label>
          <Button
            type="button"
            label="Agregar Artículo"
            icon="pi pi-plus"
            size="small"
            onClick={() => append({ itemId: "", expectedQuantity: 0 })}
            className="bg-blue-600"
          />
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 border border-gray-200 p-3 rounded-lg"
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Artículo
                  </label>
                  <Controller
                    name={`items.${index}.itemId`}
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        {...field}
                        options={itemOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione"
                        filter
                        className="w-full text-sm"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stock Esperado (Sistema)
                  </label>
                  <Controller
                    name={`items.${index}.expectedQuantity`}
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        className="w-full text-sm"
                      />
                    )}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    rounded
                    outlined
                    onClick={() => remove(index)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.items && (
          <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
        )}
      </div>

      <Divider />

      <div>
        <label className="mb-2 block font-semibold text-gray-700">Notas</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              rows={3}
              placeholder="Observaciones del conteo..."
              className="w-full"
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          onClick={() => onSuccess()}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          label={cycleCount ? "Actualizar" : "Crear"}
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
