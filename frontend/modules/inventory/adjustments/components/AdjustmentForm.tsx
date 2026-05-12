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
import adjustmentService from "@/modules/inventory/adjustments/services/adjustmentService";
import { createAdjustmentSchema } from "@/modules/inventory/adjustments/schemas/adjustmentZod";
import stockService, {
  Stock,
} from "@/modules/inventory/stocks/services/stockService";
import warehouseService, {
  Warehouse,
} from "@/modules/inventory/warehouses/services/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import ItemsTable, {
  ColumnDef,
  ItemsTableRenderRowProps,
} from "@/modules/inventory/common/ItemsTable";
import { z } from "zod";

type FormData = z.infer<typeof createAdjustmentSchema>;

const DEFAULT_ITEM: Record<string, unknown> = {
  itemId: "",
  quantityChange: 1,
  notes: "",
};

const COLUMNS: ColumnDef[] = [
  { label: "", style: { width: "32px", flexShrink: 0 } },
  { label: "Artículo", style: { flex: 1, minWidth: "200px" } },
  {
    label: "Cant. Cambio",
    style: { width: "150px", flexShrink: 0 },
    headerAlign: "center",
  },
  { label: "Notas", style: { flex: 1, minWidth: "140px" } },
  { label: "", style: { width: "40px", flexShrink: 0 } },
];

interface AdjustmentFormProps {
  warehouseId?: string;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function AdjustmentForm({
  warehouseId,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: AdjustmentFormProps) {
  const [warehouseStocks, setWarehouseStocks] = useState<Stock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createAdjustmentSchema),
    mode: "onBlur",
    defaultValues: {
      warehouseId: warehouseId || "",
      reason: "",
      items: [{ itemId: "", quantityChange: 1, notes: "" }],
      notes: "",
    },
  });

  const selectedWarehouseId = watch("warehouseId");

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setIsLoading(true);
        const res = await warehouseService.getActive();
        setWarehouses(res.data);
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
    loadWarehouses();
  }, [toast]);

  useEffect(() => {
    if (!selectedWarehouseId) {
      setWarehouseStocks([]);
      return;
    }
    let cancelled = false;
    const loadStocks = async () => {
      try {
        setLoadingStocks(true);
        const res = await stockService.getByWarehouse(
          selectedWarehouseId,
          1,
          1000,
        );
        if (!cancelled) setWarehouseStocks(res.data || []);
      } catch (error) {
        console.error("Error loading stocks:", error);
        if (!cancelled)
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al cargar stock del almacén",
            life: 3000,
          });
      } finally {
        if (!cancelled) setLoadingStocks(false);
      }
    };
    loadStocks();
    replace([{ itemId: "", quantityChange: 1, notes: "" }]);
    return () => {
      cancelled = true;
    };
  }, [selectedWarehouseId, replace, toast]);

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      await adjustmentService.create(data);
      reset();
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
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

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  const renderRow = ({
    index,
    dragHandleProps,
    isDragging,
  }: ItemsTableRenderRowProps) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        backgroundColor: isDragging
          ? "var(--surface-100)"
          : "var(--surface-card)",
        borderBottom: "1px solid var(--surface-200)",
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          ...COLUMNS[0].style,
          cursor: "grab",
          color: "var(--text-color-secondary)",
          display: "flex",
          alignItems: "center",
        }}
        {...dragHandleProps}
      >
        <i className="pi pi-bars text-xs" />
      </div>

      {/* Artículo */}
      <div style={COLUMNS[1].style}>
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
              placeholder={
                loadingStocks ? "Cargando..." : "Seleccionar artículo"
              }
              filter
              showClear
              disabled={loadingStocks || !selectedWarehouseId}
              className={
                errors.items?.[index]?.itemId ? "p-invalid w-full" : "w-full"
              }
              style={{ fontSize: "0.85rem" }}
            />
          )}
        />
      </div>

      {/* Cantidad cambio */}
      <div style={COLUMNS[2].style}>
        <Controller
          name={`items.${index}.quantityChange`}
          control={control}
          render={({ field }) => (
            <InputNumber
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              placeholder="Cant."
              showButtons
              className={
                errors.items?.[index]?.quantityChange
                  ? "p-invalid w-full"
                  : "w-full"
              }
              inputStyle={{ textAlign: "center", fontSize: "0.85rem" }}
            />
          )}
        />
      </div>

      {/* Notas */}
      <div style={COLUMNS[3].style}>
        <Controller
          name={`items.${index}.notes`}
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              value={field.value || ""}
              placeholder="Notas"
              className={
                errors.items?.[index]?.notes ? "p-invalid w-full" : "w-full"
              }
              style={{ fontSize: "0.85rem" }}
            />
          )}
        />
      </div>

      {/* Eliminar */}
      <div style={COLUMNS[4].style}>
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          type="button"
          onClick={() => remove(index)}
          disabled={fields.length === 1}
          tooltip="Eliminar"
          tooltipOptions={{ position: "left" }}
          style={{ width: "2rem", height: "2rem" }}
        />
      </div>
    </div>
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
    <form
      id={formId || "adjustment-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* Almacén */}
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

        {/* Razón */}
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

        {/* Observaciones */}
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

        {/* Artículos */}
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={DEFAULT_ITEM}
          columns={COLUMNS}
          renderRow={renderRow}
          title="Artículos a Ajustar"
          minWidth={700}
        />

        {errors.items?.message && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}
      </div>
    </form>
  );
}
