"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import { LayoutContext } from "@/layout/context/layoutcontext";
import movementService, {
  MOVEMENT_TYPE_LABELS,
  MovementType,
} from "@/app/api/inventory/movementService";
import { createMovementSchema } from "@/libs/zods/inventory";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import { z } from "zod";

type FormData = z.infer<typeof createMovementSchema>;

interface MovementFormProps {
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<Toast> | null;
}

const MOVEMENT_TYPE_OPTIONS = [
  { label: "Compra", value: "PURCHASE" as MovementType },
  { label: "Venta", value: "SALE" as MovementType },
  { label: "Ajuste Entrada", value: "ADJUSTMENT_IN" as MovementType },
  { label: "Ajuste Salida", value: "ADJUSTMENT_OUT" as MovementType },
  { label: "Transferencia", value: "TRANSFER" as MovementType },
  { label: "Retorno a Proveedor", value: "SUPPLIER_RETURN" as MovementType },
  { label: "Retorno de Taller", value: "WORKSHOP_RETURN" as MovementType },
  {
    label: "Liberación de Reserva",
    value: "RESERVATION_RELEASE" as MovementType,
  },
  { label: "Préstamo Salida", value: "LOAN_OUT" as MovementType },
  { label: "Préstamo Devolución", value: "LOAN_RETURN" as MovementType },
];

const MovementForm = ({ onSave, onCancel, toast }: MovementFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      type: "PURCHASE",
      quantity: 1,
    },
  });

  const selectedType = watch("type");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, warehousesResponse] = await Promise.all([
        itemService.getActive(),
        warehouseService.getActive(),
      ]);
      setItems(itemsResponse.data);
      setWarehouses(warehousesResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await movementService.create(data);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento creado exitosamente",
        life: 3000,
      });
      onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which warehouse fields to show based on movement type
  const showWarehouseFrom = ["SALE", "SUPPLIER_RETURN", "LOAN_OUT"].includes(
    selectedType,
  );
  const showWarehouseTo = [
    "PURCHASE",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "TRANSFER",
    "WORKSHOP_RETURN",
    "RESERVATION_RELEASE",
    "LOAN_RETURN",
  ].includes(selectedType);
  const showBoth = selectedType === "TRANSFER";

  const itemOptions = items.map((item) => ({
    label: `${item.name} (${item.sku})`,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    label: warehouse.name,
    value: warehouse.id,
  }));

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-6">
        <ProgressSpinner strokeWidth="4" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid formgrid p-3">
        {/* Type */}
        <div className="field col-12 md:col-6">
          <label htmlFor="type" className="font-semibold text-900">
            Tipo de Movimiento <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="type"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={MOVEMENT_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                className={classNames("w-full", {
                  "p-invalid": errors.type,
                  "p-filled": filledInput,
                })}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        {/* Item */}
        <div className="field col-12 md:col-6">
          <label htmlFor="itemId" className="font-semibold text-900">
            Artículo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="itemId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={itemOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar artículo"
                filter
                className={classNames("w-full", {
                  "p-invalid": errors.itemId,
                  "p-filled": filledInput,
                })}
              />
            )}
          />
          {errors.itemId && (
            <small className="p-error">{errors.itemId.message}</small>
          )}
        </div>

        {/* Quantity */}
        <div className="field col-12 md:col-4">
          <label htmlFor="quantity" className="font-semibold text-900">
            Cantidad <span className="text-red-500">*</span>
          </label>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="quantity"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={1}
                className={classNames("w-full", {
                  "p-invalid": errors.quantity,
                  "p-filled": filledInput,
                })}
              />
            )}
          />
          {errors.quantity && (
            <small className="p-error">{errors.quantity.message}</small>
          )}
        </div>

        {/* Unit Cost */}
        <div className="field col-12 md:col-4">
          <label htmlFor="unitCost" className="font-semibold text-900">
            Costo Unitario
          </label>
          <Controller
            name="unitCost"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="unitCost"
                value={field.value || 0}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                mode="currency"
                currency="CLP"
                locale="es-CL"
                className={classNames("w-full", {
                  "p-invalid": errors.unitCost,
                  "p-filled": filledInput,
                })}
              />
            )}
          />
          {errors.unitCost && (
            <small className="p-error">{errors.unitCost.message}</small>
          )}
        </div>

        {/* Reference */}
        <div className="field col-12 md:col-4">
          <label htmlFor="reference" className="font-semibold text-900">
            Referencia
          </label>
          <Controller
            name="reference"
            control={control}
            render={({ field }) => (
              <InputText
                id="reference"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Ej: PO-12345"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
              />
            )}
          />
        </div>

        {/* Warehouse From */}
        {showWarehouseFrom && (
          <div
            className={classNames("field", {
              "col-12 md:col-6": showBoth,
              "col-12": !showBoth,
            })}
          >
            <label htmlFor="warehouseFromId" className="font-semibold text-900">
              Almacén Origen{" "}
              {showBoth && <span className="text-red-500">*</span>}
            </label>
            <Controller
              name="warehouseFromId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="warehouseFromId"
                  value={field.value || null}
                  onChange={(e) => field.onChange(e.value)}
                  options={warehouseOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar almacén"
                  filter
                  showClear
                  className={classNames("w-full", {
                    "p-invalid": errors.warehouseFromId,
                    "p-filled": filledInput,
                  })}
                />
              )}
            />
            {errors.warehouseFromId && (
              <small className="p-error">
                {errors.warehouseFromId.message}
              </small>
            )}
          </div>
        )}

        {/* Warehouse To */}
        {showWarehouseTo && (
          <div
            className={classNames("field", {
              "col-12 md:col-6": showBoth,
              "col-12": !showBoth,
            })}
          >
            <label htmlFor="warehouseToId" className="font-semibold text-900">
              Almacén Destino{" "}
              {showBoth && <span className="text-red-500">*</span>}
            </label>
            <Controller
              name="warehouseToId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="warehouseToId"
                  value={field.value || null}
                  onChange={(e) => field.onChange(e.value)}
                  options={warehouseOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar almacén"
                  filter
                  showClear
                  className={classNames("w-full", {
                    "p-invalid": errors.warehouseToId,
                    "p-filled": filledInput,
                  })}
                />
              )}
            />
            {errors.warehouseToId && (
              <small className="p-error">{errors.warehouseToId.message}</small>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="field col-12">
          <label htmlFor="notes" className="font-semibold text-900">
            Notas
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputText
                id="notes"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Añadir notas adicionales..."
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
              />
            )}
          />
        </div>

        {/* Buttons */}
        <div className="field col-12 flex gap-2 justify-content-end pt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onCancel}
            className="p-button-outlined"
            disabled={submitting}
          />
          <Button
            label="Crear Movimiento"
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
          />
        </div>
      </div>
    </form>
  );
};

export default MovementForm;
