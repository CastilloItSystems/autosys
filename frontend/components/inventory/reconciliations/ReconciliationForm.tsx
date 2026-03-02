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
  createReconciliation,
  updateReconciliation,
  Reconciliation,
  ReconciliationSource,
} from "../../../app/api/inventory/reconciliationService";
import { getActiveItems } from "../../../app/api/inventory/itemService";
import { Warehouse } from "../../../app/api/inventory/warehouseService";
import {
  createReconciliationSchema,
  CreateReconciliationInput,
} from "../../../libs/zods/inventory/reconciliationZod";
import { handleFormError } from "../../../utils/errorHandlers";
import { RECONCILIATION_SOURCE_CONFIG } from "../../../libs/interfaces/inventory/reconciliation.interface";

interface ReconciliationFormProps {
  reconciliation?: Reconciliation;
  warehouses: Warehouse[];
  onSuccess: () => void;
}

export default function ReconciliationForm({
  reconciliation,
  warehouses,
  onSuccess,
}: ReconciliationFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateReconciliationInput>({
    resolver: zodResolver(createReconciliationSchema),
    defaultValues: {
      warehouseId: reconciliation?.warehouseId || "",
      source: reconciliation?.source || ReconciliationSource.PHYSICAL_INVENTORY,
      items: reconciliation?.items || [
        { itemId: "", systemQuantity: 0, expectedQuantity: 0 },
      ],
      notes: reconciliation?.notes || "",
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

  const onSubmit = async (data: CreateReconciliationInput) => {
    try {
      setIsSubmitting(true);
      const submitData = {
        ...data,
        source: data.source as ReconciliationSource | undefined,
      };
      if (reconciliation) {
        await updateReconciliation(reconciliation.id, submitData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Reconciliación actualizada",
          life: 3000,
        });
      } else {
        await createReconciliation(submitData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Reconciliación creada",
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

  const sourceOptions = Object.entries(RECONCILIATION_SOURCE_CONFIG).map(
    ([key, config]) => ({
      label: config.label,
      value: key,
    }),
  );

  if (initialLoading) {
    return <ProgressSpinner />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Toast ref={toast} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <div>
          <label className="mb-2 block font-semibold text-gray-700">
            Origen de Discrepancia *
          </label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <>
                <Dropdown
                  {...field}
                  options={sourceOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione origen"
                  className="w-full"
                />
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.source.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>

      <Divider />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="font-semibold text-gray-700">
            Artículos con Discrepancias *
          </label>
          <Button
            type="button"
            label="Agregar Artículo"
            icon="pi pi-plus"
            size="small"
            onClick={() =>
              append({ itemId: "", systemQuantity: 0, expectedQuantity: 0 })
            }
            className="bg-blue-600"
          />
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 border border-gray-200 p-3 rounded-lg"
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
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
                    Stock Sistema
                  </label>
                  <Controller
                    name={`items.${index}.systemQuantity`}
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

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stock Esperado/Real
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
              placeholder="Detalles de las discrepancias..."
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
          label={reconciliation ? "Actualizar" : "Crear"}
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
