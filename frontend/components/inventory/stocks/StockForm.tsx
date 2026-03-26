"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import { Stock } from "@/app/api/inventory/stockService";
import stockService from "@/app/api/inventory/stockService";
import itemService from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import {
  createStockSchema,
  updateStockSchema,
  CreateStock,
  UpdateStock,
} from "@/libs/zods/inventory/stockZod";
import { handleFormError } from "@/utils/errorHandlers";

interface StockFormProps {
  stock: Stock | null;
  onSave: () => void | Promise<void>;
  onCancel?: () => void;
  toast: React.RefObject<any>;
  onSubmittingChange?: (submitting: boolean) => void;
  formId?: string;
}

export default function StockForm({
  stock,
  onSave,
  onCancel,
  toast,
  onSubmittingChange,
  formId = "stock-form",
}: StockFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [warehouses, setWarehouses] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const isEditing = !!stock?.id;
  const schema = isEditing ? updateStockSchema : createStockSchema;

  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<CreateStock | UpdateStock>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      ...(isEditing
        ? {
            quantityReal: stock.quantityReal ?? 0,
            quantityReserved: stock.quantityReserved ?? 0,
            location: stock.location ?? "",
            averageCost: stock.averageCost ?? 0,
          }
        : {
            itemId: "",
            warehouseId: "",
            quantityReal: 0,
            quantityReserved: 0,
            location: "",
            averageCost: 0,
          }),
    },
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        itemService.getActive(),
        warehouseService.getActive(),
      ]);

      // itemsRes puede ser { data: [...] } con items activos
      const itemsData = itemsRes?.data || [];
      setItems(
        (Array.isArray(itemsData) ? itemsData : []).map((item: any) => ({
          label: `${item.sku || ""} – ${item.name}`,
          value: item.id,
        })),
      );

      const whData = warehousesRes?.data || [];
      setWarehouses(
        (Array.isArray(whData) ? whData : []).map((wh: Warehouse) => ({
          label: `${wh.code} – ${wh.name}`,
          value: wh.id,
        })),
      );
    } catch (error) {
      console.error("Error loading dropdown data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateStock | UpdateStock) => {
    setSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (isEditing) {
        await stockService.update(stock.id, data as UpdateStock);
      } else {
        await stockService.create(data as CreateStock);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-content-center p-4">
        <ProgressSpinner style={{ width: "50px", height: "50px" }} />
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid formgrid row-gap-2 p-3">
        {/* Artículo — solo para crear */}
        {!isEditing && (
          <div className="field col-12 md:col-6">
            <label htmlFor="itemId" className="font-medium text-900">
              Artículo <span className="text-red-500">*</span>
            </label>
            <Controller
              name="itemId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="itemId"
                  value={(field as any).value}
                  onChange={(e) => field.onChange(e.value)}
                  options={items}
                  placeholder="Seleccione un artículo"
                  filter
                  className={classNames("w-full", {
                    "p-invalid": (errors as any).itemId,
                  })}
                />
              )}
            />
            {(errors as any).itemId && (
              <small className="p-error">
                {(errors as any).itemId.message}
              </small>
            )}
          </div>
        )}

        {/* Almacén — solo para crear */}
        {!isEditing && (
          <div className="field col-12 md:col-6">
            <label htmlFor="warehouseId" className="font-medium text-900">
              Almacén <span className="text-red-500">*</span>
            </label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="warehouseId"
                  value={(field as any).value}
                  onChange={(e) => field.onChange(e.value)}
                  options={warehouses}
                  placeholder="Seleccione un almacén"
                  filter
                  className={classNames("w-full", {
                    "p-invalid": (errors as any).warehouseId,
                  })}
                />
              )}
            />
            {(errors as any).warehouseId && (
              <small className="p-error">
                {(errors as any).warehouseId.message}
              </small>
            )}
          </div>
        )}

        {/* Info del stock existente (solo editar) */}
        {isEditing && (
          <div className="field col-12">
            <div className="surface-100 border-round p-3 mb-2">
              <div className="flex gap-4">
                <div>
                  <span className="text-500 text-sm">Artículo:</span>
                  <p className="font-semibold m-0 mt-1">
                    {stock.item?.name || stock.itemId}
                  </p>
                </div>
                <div>
                  <span className="text-500 text-sm">Almacén:</span>
                  <p className="font-semibold m-0 mt-1">
                    {stock.warehouse?.name || stock.warehouseId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cantidad Real */}
        <div className="field col-12 md:col-3">
          <label htmlFor="quantityReal" className="font-medium text-900">
            Cantidad Real
          </label>
          <Controller
            name="quantityReal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="quantityReal"
                value={field.value as number}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                className={classNames("w-full", {
                  "p-invalid": errors.quantityReal,
                })}
              />
            )}
          />
          {errors.quantityReal && (
            <small className="p-error">{errors.quantityReal.message}</small>
          )}
        </div>

        {/* Cantidad Reservada */}
        <div className="field col-12 md:col-3">
          <label htmlFor="quantityReserved" className="font-medium text-900">
            Reservado
          </label>
          <Controller
            name="quantityReserved"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="quantityReserved"
                value={field.value as number}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                className={classNames("w-full", {
                  "p-invalid": errors.quantityReserved,
                })}
              />
            )}
          />
          {errors.quantityReserved && (
            <small className="p-error">{errors.quantityReserved.message}</small>
          )}
        </div>

        {/* Ubicación Física */}
        <div className="field col-12 md:col-3">
          <label htmlFor="location" className="font-medium text-900">
            Ubicación Física
          </label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <input
                id="location"
                type="text"
                className={classNames("p-inputtext p-component w-full", {
                  "p-invalid": errors.location,
                })}
                value={(field.value as string) || ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Ej. Pasillo A"
              />
            )}
          />
          {errors.location && (
            <small className="p-error">{errors.location.message}</small>
          )}
        </div>

        {/* Costo Promedio */}
        <div className="field col-12 md:col-3">
          <label htmlFor="averageCost" className="font-medium text-900">
            Costo Promedio
          </label>
          <Controller
            name="averageCost"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="averageCost"
                value={field.value as number}
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                className={classNames("w-full", {
                  "p-invalid": errors.averageCost,
                })}
              />
            )}
          />
          {errors.averageCost && (
            <small className="p-error">{errors.averageCost.message}</small>
          )}
        </div>
      </div>
    </form>
  );
}
