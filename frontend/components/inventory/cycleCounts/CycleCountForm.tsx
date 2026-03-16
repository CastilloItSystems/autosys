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
import { classNames } from "primereact/utils";

import cycleCountService, {
  CycleCount,
} from "../../../app/api/inventory/cycleCountService";
import stockService from "../../../app/api/inventory/stockService";
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
  onCancel: () => void;
}

export default function CycleCountForm({
  cycleCount,
  warehouses,
  onSuccess,
  onCancel,
}: CycleCountFormProps) {
  const [items, setItems] = useState<any[]>([]); // Items available in warehouse
  const [itemsStock, setItemsStock] = useState<Record<string, number>>({}); // Map itemId -> quantity
  const [initialLoading, setInitialLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection modes
  const [selectionMode, setSelectionMode] = useState<
    "manual" | "all" | "positive_stock" | "random"
  >("manual");
  const [randomCount, setRandomCount] = useState(10);

  const toast = useRef<Toast>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCycleCountInput>({
    resolver: zodResolver(createCycleCountSchema),
    defaultValues: {
      warehouseId: cycleCount?.warehouseId || "",
      items: cycleCount?.items || [],
      notes: cycleCount?.notes || "",
    },
  });

  const selectedWarehouseId = watch("warehouseId");

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  // Load items when warehouse changes
  useEffect(() => {
    if (!selectedWarehouseId) {
      setItems([]);
      setItemsStock({});
      return;
    }

    const loadStock = async () => {
      try {
        setInitialLoading(true);
        const response = await stockService.getByWarehouse(selectedWarehouseId);
        const stocks = response.data || [];

        // Map stock to items and store quantity map
        const availableItems = stocks.map((s: any) => s.item);
        const stockMap: Record<string, number> = {};
        stocks.forEach((s: any) => {
          stockMap[s.itemId] = s.quantityReal;
        });

        setItems(availableItems);
        setItemsStock(stockMap);

        // If editing, preserve existing items but update stock info if needed
        if (cycleCount) {
          // Logic to refresh stock values could go here if needed
        } else {
          // If new, clear items when warehouse changes
          replace([]);
          setSelectionMode("manual");
        }
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar stock del almacén",
          life: 3000,
        });
        setItems([]);
      } finally {
        setInitialLoading(false);
      }
    };

    loadStock();
  }, [selectedWarehouseId, cycleCount]);

  // Handle bulk selection logic
  const applySelectionMode = () => {
    if (items.length === 0) return;

    let selectedItems: any[] = [];

    switch (selectionMode) {
      case "all":
        selectedItems = items;
        break;
      case "positive_stock":
        selectedItems = items.filter((item) => (itemsStock[item.id] || 0) > 0);
        break;
      case "random":
        // Simple random selection
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        selectedItems = shuffled.slice(0, randomCount);
        break;
      case "manual":
      default:
        return; // Do nothing for manual
    }

    // Map to form structure
    const formItems = selectedItems.map((item) => ({
      itemId: item.id,
      expectedQuantity: itemsStock[item.id] || 0,
      notes: "",
    }));

    replace(formItems);

    toast.current?.show({
      severity: "info",
      summary: "Selección Aplicada",
      detail: `Se agregaron ${formItems.length} artículos al conteo`,
      life: 2000,
    });
  };

  const onSubmit = async (data: CreateCycleCountInput) => {
    try {
      setIsSubmitting(true);
      if (cycleCount) {
        await cycleCountService.update(cycleCount.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Conteo actualizado",
          life: 3000,
        });
      } else {
        await cycleCountService.create(data);
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
    label: `${item.sku} - ${item.name}`,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  if (initialLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-6">
        <ProgressSpinner />
        <span className="mt-3 text-gray-600">Cargando inventario...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <Toast ref={toast} />

      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block font-medium mb-2">Almacén *</label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className={classNames({ "p-invalid": errors.warehouseId })}
                disabled={!!cycleCount} // Disable if editing existing count
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error block">
              {errors.warehouseId.message}
            </small>
          )}
        </div>

        <div className="col-12 md:col-6">
          <label className="block font-medium mb-2">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={1}
                autoResize
                placeholder="Referencia o motivo del conteo..."
              />
            )}
          />
        </div>
      </div>

      <Divider />

      {/* Selection Toolbar */}
      <div className="surface-100 p-3 border-round mb-3">
        <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="flex flex-column gap-2">
            <span className="font-bold text-gray-700">Modo de Selección:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                label="Manual"
                icon="pi pi-hand-pointer"
                size="small"
                outlined={selectionMode !== "manual"}
                onClick={() => setSelectionMode("manual")}
              />
              <Button
                type="button"
                label="Todo el Stock"
                icon="pi pi-list"
                size="small"
                outlined={selectionMode !== "all"}
                onClick={() => setSelectionMode("all")}
              />
              <Button
                type="button"
                label="Stock Positivo"
                icon="pi pi-box"
                size="small"
                outlined={selectionMode !== "positive_stock"}
                onClick={() => setSelectionMode("positive_stock")}
              />
              <Button
                type="button"
                label="Aleatorio"
                icon="pi pi-refresh"
                size="small"
                outlined={selectionMode !== "random"}
                onClick={() => setSelectionMode("random")}
              />
            </div>
          </div>

          <div className="flex gap-2 align-items-center align-self-end">
            {selectionMode === "random" && (
              <span className="p-input-icon-left w-6rem">
                <InputNumber
                  value={randomCount}
                  onValueChange={(e) => setRandomCount(e.value || 10)}
                  min={1}
                  max={items.length}
                  inputClassName="w-full text-center p-1"
                  placeholder="Cant."
                />
              </span>
            )}
            {selectionMode !== "manual" && (
              <Button
                type="button"
                label="Aplicar Selección"
                icon="pi pi-check"
                severity="warning"
                size="small"
                onClick={applySelectionMode}
                disabled={!selectedWarehouseId}
              />
            )}
            {selectionMode === "manual" && (
              <Button
                type="button"
                label="Agregar Línea"
                icon="pi pi-plus"
                size="small"
                onClick={() => append({ itemId: "", expectedQuantity: 0 })}
                className="bg-blue-600"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-content-between align-items-center mb-2">
        <h3 className="text-lg font-semibold m-0">
          Artículos ({fields.length})
        </h3>
        {fields.length > 0 && (
          <Button
            type="button"
            label="Limpiar Todo"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            onClick={() => replace([])}
          />
        )}
      </div>

      <div className="grid">
        <div className="col-12">
          {fields.length === 0 ? (
            <div className="text-center p-5 border-dashed border-1 border-300 border-round bg-gray-50">
              <i className="pi pi-shopping-cart text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 m-0">
                No hay artículos seleccionados para el conteo.
              </p>
              <p className="text-sm text-gray-400">
                Seleccione un modo arriba o agregue líneas manualmente.
              </p>
            </div>
          ) : (
            <div className="flex flex-column gap-2">
              {/* Headers for larger screens */}
              <div className="hidden md:flex gap-3 px-3 py-2 bg-gray-100 border-round text-sm font-semibold text-gray-600">
                <div className="flex-1">Artículo</div>
                <div className="w-8rem text-center">Stock Sistema</div>
                <div className="w-3rem"></div>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="surface-card p-3 border-1 border-200 border-round flex flex-column md:flex-row gap-3 align-items-center"
                >
                  <div className="w-full md:flex-1">
                    <span className="md:hidden block font-bold mb-1 text-sm">
                      Artículo
                    </span>
                    <Controller
                      name={`items.${index}.itemId`}
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          {...field}
                          options={itemOptions}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Seleccione artículo"
                          filter
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.itemId,
                          })}
                          onChange={(e) => {
                            field.onChange(e.value);
                            // Auto-fill expected quantity from system stock
                            if (itemsStock[e.value] !== undefined) {
                              setValue(
                                `items.${index}.expectedQuantity`,
                                itemsStock[e.value],
                              );
                            } else {
                              setValue(`items.${index}.expectedQuantity`, 0);
                            }
                          }}
                          itemTemplate={(option) => {
                            const stock = itemsStock[option.value] || 0;
                            return (
                              <div className="flex justify-content-between align-items-center w-full gap-2">
                                <span className="white-space-nowrap overflow-hidden text-overflow-ellipsis">
                                  {option.label}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 border-round flex-shrink-0 ${
                                    stock > 0
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  Stock: {stock}
                                </span>
                              </div>
                            );
                          }}
                        />
                      )}
                    />
                    {errors.items?.[index]?.itemId && (
                      <small className="p-error block">
                        {errors.items[index]?.itemId?.message}
                      </small>
                    )}
                  </div>

                  <div className="w-full md:w-8rem">
                    <span className="md:hidden block font-bold mb-1 text-sm">
                      Stock Sistema
                    </span>
                    <Controller
                      name={`items.${index}.expectedQuantity`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          min={0}
                          className="w-full"
                          inputClassName="text-center bg-gray-50"
                          readOnly
                          disabled
                        />
                      )}
                    />
                  </div>

                  <div className="flex justify-content-end">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      onClick={() => remove(index)}
                      tooltip="Eliminar línea"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 border-200">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          label={cycleCount ? "Actualizar Borrador" : "Crear Borrador"}
          icon="pi pi-check"
          loading={isSubmitting}
          disabled={fields.length === 0}
        />
      </div>
    </form>
  );
}
