"use client";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { classNames } from "primereact/utils";
import adjustmentService, {
  ADJUSTMENT_TYPE_LABELS,
} from "@/app/api/inventory/adjustmentService";
import { createAdjustmentSchema } from "@/libs/zods";
import stockService, { Stock } from "@/app/api/inventory/stockService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import { z } from "zod";

type FormData = z.infer<typeof createAdjustmentSchema>;

interface AdjustmentFormProps {
  warehouseId?: string;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<Toast> | null;
}

export default function AdjustmentForm({
  warehouseId,
  onSave,
  onCancel,
  toast,
}: AdjustmentFormProps) {
  // State
  const [warehouseStocks, setWarehouseStocks] = useState<Stock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createAdjustmentSchema),
    defaultValues: {
      warehouseId: warehouseId || "",
      reason: "",
      items: [{ itemId: "", quantityChange: 1, notes: "" }],
      notes: "",
    },
  });

  const selectedWarehouseId = watch("warehouseId");

  // Field array for items
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  // Load data on mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      const warehousesResponse = await warehouseService.getActive();
      setWarehouses(warehousesResponse.data);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los almacenes",
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar stocks del almacén seleccionado
  useEffect(() => {
    if (!selectedWarehouseId) {
      setWarehouseStocks([]);
      return;
    }

    const loadStocks = async () => {
      try {
        setLoadingStocks(true);
        const response = await stockService.getByWarehouse(
          selectedWarehouseId,
          1,
          1000,
        );
        setWarehouseStocks(response.data || []);
      } catch (error) {
        console.error("Error loading stocks:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar stock del almacén",
          life: 3000,
        });
      } finally {
        setLoadingStocks(false);
      }
    };

    loadStocks();
    // Reset items to default when warehouse changes
    replace([{ itemId: "", quantityChange: 1, notes: "" }]);
  }, [selectedWarehouseId, replace]);

  const onSubmit = async (data: FormData) => {
    try {
      await adjustmentService.create(data);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Ajuste de inventario creado exitosamente",
        life: 3000,
      });
      reset();
      onSave();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const itemOptions = warehouseStocks.map((stock) => ({
    label: stock.item
      ? `${stock.item.sku || "—"} - ${stock.item.name} (Disp: ${
          stock.quantityAvailable
        })`
      : stock.itemId,
    value: stock.itemId,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    label: warehouse.name,
    value: warehouse.id,
  }));

  const removeItemTemplate = (rowData: any, options: any) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      onClick={() => remove(options.rowIndex)}
      disabled={fields.length === 1}
      tooltip="Eliminar artículo"
      tooltipOptions={{ position: "left" }}
    />
  );

  const itemSelectionTemplate = (rowData: any, options: any) => (
    <Controller
      name={`items.${options.rowIndex}.itemId`}
      control={control}
      render={({ field }) => (
        <Dropdown
          value={field.value}
          onChange={(e) => field.onChange(e.value)}
          options={itemOptions}
          optionLabel="label"
          optionValue="value"
          placeholder={loadingStocks ? "Cargando..." : "Seleccionar"}
          filter
          showClear
          disabled={loadingStocks || !selectedWarehouseId}
          className={
            errors.items?.[options.rowIndex]?.itemId ? "p-invalid" : ""
          }
        />
      )}
    />
  );

  const quantityTemplate = (rowData: any, options: any) => (
    <Controller
      name={`items.${options.rowIndex}.quantityChange`}
      control={control}
      render={({ field }) => (
        <InputNumber
          value={field.value}
          onValueChange={(e) => field.onChange(e.value)}
          placeholder="Cantidad"
          className={
            errors.items?.[options.rowIndex]?.quantityChange ? "p-invalid" : ""
          }
        />
      )}
    />
  );

  const notesTemplate = (rowData: any, options: any) => (
    <Controller
      name={`items.${options.rowIndex}.notes`}
      control={control}
      render={({ field }) => (
        <InputText
          {...field}
          value={field.value || ""}
          placeholder="Notas"
          className={errors.items?.[options.rowIndex]?.notes ? "p-invalid" : ""}
        />
      )}
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Warehouse */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="warehouseId"
            className="block text-900 font-medium mb-2"
          >
            Almacén <span className="text-red-500">*</span>
          </label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="warehouseId"
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar almacén"
                filter
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error block mt-1">
              {errors.warehouseId.message}
            </small>
          )}
        </div>

        {/* Reason */}
        <div className="col-12 md:col-6">
          <label htmlFor="reason" className="block text-900 font-medium mb-2">
            Razón del Ajuste <span className="text-red-500">*</span>
          </label>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <InputText
                id="reason"
                {...field}
                value={field.value || ""}
                placeholder="Ej: Diferencia en conteo, deterioro"
                className={errors.reason ? "p-invalid" : ""}
              />
            )}
          />
          {errors.reason && (
            <small className="p-error block mt-1">
              {errors.reason.message}
            </small>
          )}
        </div>

        {/* Notes */}
        <div className="col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Observaciones Generales
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                {...field}
                value={field.value || ""}
                rows={2}
                placeholder="Observaciones adicionales del ajuste..."
              />
            )}
          />
        </div>

        {/* Items Table */}
        <div className="col-12">
          <div className="flex justify-content-between align-items-center mb-3">
            <label className="block text-900 font-medium">
              Artículos a Ajustar <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              icon="pi pi-plus"
              label="Agregar Artículo"
              size="small"
              onClick={() =>
                append({ itemId: "", quantityChange: 1, notes: "" })
              }
              className="p-button-success"
            />
          </div>

          <DataTable
            value={fields}
            responsiveLayout="scroll"
            size="small"
            className={errors.items ? "p-invalid" : ""}
          >
            <Column
              field="itemId"
              header="Artículo"
              style={{ width: "35%" }}
              body={itemSelectionTemplate}
            />
            <Column
              field="quantityChange"
              header="Cantidad de Cambio"
              style={{ width: "25%" }}
              body={quantityTemplate}
            />
            <Column
              field="notes"
              header="Notas"
              style={{ width: "30%" }}
              body={notesTemplate}
            />
            <Column
              style={{ width: "10%" }}
              body={removeItemTemplate}
              exportable={false}
            />
          </DataTable>

          {errors.items?.message && (
            <small className="p-error block mt-2">{errors.items.message}</small>
          )}
        </div>
      </div>

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
          label="Crear Ajuste"
          icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
          type="submit"
          loading={isSubmitting}
        />
      </div>
    </form>
  );
}
