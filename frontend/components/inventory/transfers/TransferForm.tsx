"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";

// API functions
import transferService from "@/app/api/inventory/transferService";
import type { Transfer } from "@/libs/interfaces";
import stockService, { Stock } from "@/app/api/inventory/stockService";
import { Warehouse } from "@/app/api/inventory/warehouseService";

// Zod schema
import {
  createTransferSchema,
  CreateTransferInput,
} from "@/libs/zods/inventory/transferZod";

// Utils
import { handleFormError } from "@/utils/errorHandlers";

interface TransferFormProps {
  transfer: Transfer | null;
  warehouses: Warehouse[];
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

export default function TransferForm({
  transfer,
  warehouses,
  onSave,
  onCancel,
  toast,
}: TransferFormProps) {
  const isEditing = !!transfer?.id;
  const [warehouseStocks, setWarehouseStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      fromWarehouseId: "",
      toWarehouseId: "",
      items: [{ itemId: "", quantity: 1, unitCost: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const fromWarehouseId = watch("fromWarehouseId");
  const formItems = watch("items");

  // Loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar stocks del almacén origen cuando cambia
  useEffect(() => {
    if (!fromWarehouseId || isEditing) return;

    const loadWarehouseStocks = async () => {
      setLoadingStocks(true);
      try {
        const response = await getStockByWarehouse(fromWarehouseId, 1, 1000);
        const stocks = (response.data || []).filter(
          (s) => s.quantityAvailable > 0,
        );
        setWarehouseStocks(stocks);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar stock del almacén",
          life: 3000,
        });
        setWarehouseStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    };

    loadWarehouseStocks();
    // Reset items when warehouse changes
    replace([{ itemId: "", quantity: 1, unitCost: 0 }]);
  }, [fromWarehouseId]);

  // Cargar datos de la transferencia si está en modo edición
  useEffect(() => {
    if (transfer && !isLoading) {
      reset({
        fromWarehouseId: transfer.fromWarehouseId || "",
        toWarehouseId: transfer.toWarehouseId || "",
        items: transfer.items?.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          unitCost: i.unitCost || 0,
        })) || [{ itemId: "", quantity: 1, unitCost: 0 }],
        notes: transfer.notes || "",
      });
    } else if (!transfer && !isLoading) {
      reset({
        fromWarehouseId: "",
        toWarehouseId: "",
        items: [{ itemId: "", quantity: 1, unitCost: 0 }],
        notes: "",
      });
    }
  }, [transfer, reset, isLoading]);

  // Helper: get available quantity for a given item
  const getAvailableQty = (itemId: string): number => {
    const stock = warehouseStocks.find((s) => s.itemId === itemId);
    return stock?.quantityAvailable ?? 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: CreateTransferInput) => {
    try {
      if (isEditing) {
        await transferService.update(transfer!.id, { notes: data.notes });
      } else {
        await transferService.create(data);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving transfer:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la transferencia",
        life: 3000,
      });
    }
  };

  // Build item options from warehouse stocks — show SKU, name, and available qty
  const itemOptions = warehouseStocks.map((stock) => ({
    label: stock.item
      ? `${stock.item.sku || "—"} - ${stock.item.name} (Disp: ${
          stock.quantityAvailable
        })`
      : stock.itemId,
    value: stock.itemId,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  const filteredToWarehouseOptions = warehouses
    .filter((w) => w.id !== fromWarehouseId)
    .map((w) => ({ label: w.name, value: w.id }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {isLoading ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {/* Almacén Origen */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="fromWarehouseId"
                className="block text-900 font-medium mb-2"
              >
                Almacén Origen <span className="text-red-500">*</span>
              </label>
              <Controller
                name="fromWarehouseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="fromWarehouseId"
                    options={warehouseOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione almacén origen"
                    className={errors.fromWarehouseId ? "p-invalid" : ""}
                    disabled={isEditing}
                  />
                )}
              />
              {errors.fromWarehouseId && (
                <small className="p-error block mt-1">
                  {errors.fromWarehouseId.message}
                </small>
              )}
            </div>

            {/* Almacén Destino */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="toWarehouseId"
                className="block text-900 font-medium mb-2"
              >
                Almacén Destino <span className="text-red-500">*</span>
              </label>
              <Controller
                name="toWarehouseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="toWarehouseId"
                    options={filteredToWarehouseOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione almacén destino"
                    className={errors.toWarehouseId ? "p-invalid" : ""}
                    disabled={!fromWarehouseId || isEditing}
                  />
                )}
              />
              {errors.toWarehouseId && (
                <small className="p-error block mt-1">
                  {errors.toWarehouseId.message}
                </small>
              )}
            </div>

            {/* Notas */}
            <div className="col-12">
              <label
                htmlFor="notes"
                className="block text-900 font-medium mb-2"
              >
                Notas
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    id="notes"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className={errors.notes ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.notes && (
                <small className="p-error block mt-1">
                  {errors.notes.message}
                </small>
              )}
            </div>
          </div>

          <Divider />

          {/* Artículos */}
          <div className="mb-3 flex align-items-center justify-content-between">
            <label className="block text-900 font-medium">
              Artículos <span className="text-red-500">*</span>
            </label>
            {!isEditing && (
              <Button
                type="button"
                label="Agregar Artículo"
                icon="pi pi-plus"
                size="small"
                outlined
                disabled={!fromWarehouseId || warehouseStocks.length === 0}
                onClick={() => append({ itemId: "", quantity: 1, unitCost: 0 })}
              />
            )}
          </div>

          {!fromWarehouseId && !isEditing && (
            <Message
              severity="info"
              text="Seleccione un almacén origen para ver los artículos disponibles."
              className="w-full mb-3"
            />
          )}

          {fromWarehouseId &&
            !loadingStocks &&
            warehouseStocks.length === 0 &&
            !isEditing && (
              <Message
                severity="warn"
                text="No hay artículos con stock disponible en el almacén seleccionado."
                className="w-full mb-3"
              />
            )}

          {loadingStocks && (
            <div className="flex align-items-center gap-2 mb-3">
              <ProgressSpinner
                style={{ width: "20px", height: "20px" }}
                strokeWidth="4"
              />
              <span className="text-600">Cargando stock del almacén...</span>
            </div>
          )}

          {fields.map((field, index) => {
            const selectedItemId = formItems?.[index]?.itemId;
            const maxQty = selectedItemId
              ? getAvailableQty(selectedItemId)
              : undefined;

            return (
              <div
                key={field.id}
                className="surface-ground border-round p-3 mb-3"
              >
                <div className="grid">
                  <div className="col-12 md:col-5">
                    <label className="block text-900 font-medium mb-2">
                      Artículo
                    </label>
                    <Controller
                      name={`items.${index}.itemId`}
                      control={control}
                      render={({ field: f }) => (
                        <Dropdown
                          {...f}
                          onChange={(e) => {
                            f.onChange(e.value);
                            // Auto-fill unitCost from stock average cost
                            const stock = warehouseStocks.find(
                              (s) => s.itemId === e.value,
                            );
                            if (stock) {
                              setValue(
                                `items.${index}.unitCost`,
                                Number(stock.averageCost) || 0,
                              );
                            }
                          }}
                          options={itemOptions}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Seleccione artículo"
                          filter
                          className={
                            errors.items?.[index]?.itemId ? "p-invalid" : ""
                          }
                          disabled={isEditing || !fromWarehouseId}
                        />
                      )}
                    />
                    {errors.items?.[index]?.itemId && (
                      <small className="p-error block mt-1">
                        {errors.items[index]?.itemId?.message}
                      </small>
                    )}
                  </div>

                  <div className="col-12 md:col-3">
                    <label className="block text-900 font-medium mb-2">
                      Cantidad{" "}
                      {maxQty !== undefined && (
                        <span className="text-500 font-normal text-sm">
                          (máx: {maxQty})
                        </span>
                      )}
                    </label>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          id={`items.${index}.quantity`}
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 1)}
                          min={1}
                          max={maxQty}
                          className={
                            errors.items?.[index]?.quantity ? "p-invalid" : ""
                          }
                          disabled={isEditing}
                        />
                      )}
                    />
                    {errors.items?.[index]?.quantity && (
                      <small className="p-error block mt-1">
                        {errors.items[index]?.quantity?.message}
                      </small>
                    )}
                  </div>

                  <div className="col-12 md:col-3">
                    <label className="block text-900 font-medium mb-2">
                      Costo Unit.
                    </label>
                    <Controller
                      name={`items.${index}.unitCost`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          id={`items.${index}.unitCost`}
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          mode="currency"
                          currency="USD"
                          disabled={isEditing}
                        />
                      )}
                    />
                  </div>

                  <div className="col-12 md:col-1 flex align-items-end justify-content-center">
                    {!isEditing && fields.length > 1 && (
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        text
                        onClick={() => remove(index)}
                        tooltip="Eliminar artículo"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {errors.items && typeof errors.items.message === "string" && (
            <small className="p-error block mt-1">{errors.items.message}</small>
          )}

          {isEditing && (
            <Message
              severity="warn"
              text="Solo las notas pueden editarse en borradores existentes. Para cambiar artículos o almacenes, elimine y cree una nueva transferencia."
              className="w-full mt-3"
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
              type="button"
              disabled={isSubmitting}
            />
            <Button
              label={isEditing ? "Actualizar" : "Crear"}
              icon="pi pi-check"
              type="submit"
              loading={isSubmitting}
            />
          </div>
        </>
      )}
    </form>
  );
}
