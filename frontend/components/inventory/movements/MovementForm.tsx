"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { movementSchema } from "@/libs/zods/inventory";
import {
  createMovement,
  updateMovement,
} from "@/app/api/inventory/movementService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Item, Warehouse } from "@/libs/interfaces/inventory";

type FormData = z.infer<typeof movementSchema>;

interface MovementFormProps {
  movement: any;
  hideFormDialog: () => void;
  movements: any[];
  setMovements: (movements: any[]) => void;
  setMovement: (movement: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

const tipoOptions = [
  { label: "Entrada", value: "entrada" },
  { label: "Salida", value: "salida" },
  { label: "Transferencia", value: "transferencia" },
  { label: "Ajuste", value: "ajuste" },
];

const MovementForm = ({
  movement,
  toast,
  hideFormDialog,
  movements,
  setMovements,
  showToast,
  items,
  warehouses,
}: MovementFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string | undefined>(
    movement?.tipo
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      tipo: "entrada",
      cantidad: 1,
      costoUnitario: 0,
    },
  });

  const tipo = watch("tipo");

  useEffect(() => {
    setSelectedTipo(tipo);
  }, [tipo]);

  useEffect(() => {
    if (movement) {
      Object.keys(movement).forEach((key) =>
        setValue(key as keyof FormData, movement[key])
      );
      setSelectedTipo(movement.tipo);
    }
  }, [movement, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (movement) {
        const updatedMovement = await updateMovement(movement.id, data);
        const updatedMovements = movements.map((t) =>
          t.id === updatedMovement.id ? updatedMovement : t
        );
        setMovements(updatedMovements);
        showToast("success", "Éxito", "Movimiento actualizado");
      } else {
        const newMovement = await createMovement(data);
        setMovements([...movements, newMovement]);
        showToast("success", "Éxito", "Movimiento creado");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const itemOptions = items.map((item) => ({
    label: item.nombre,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    label: warehouse.nombre,
    value: warehouse.id,
  }));

  const showWarehouseFrom =
    selectedTipo === "salida" || selectedTipo === "transferencia";
  const showWarehouseTo =
    selectedTipo === "entrada" || selectedTipo === "transferencia";

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-arrow-right-arrow-left mr-3 text-primary text-3xl"></i>
                {movement ? "Modificar Movimiento" : "Crear Movimiento"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Tipo */}
            <div className="field col-12 md:col-6">
              <label htmlFor="tipo" className="font-medium text-900">
                Tipo <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={tipoOptions}
                    placeholder="Seleccione un tipo"
                    className={classNames("w-full", {
                      "p-invalid": errors.tipo,
                    })}
                  />
                )}
              />
              {errors.tipo && (
                <small className="p-error">{errors.tipo.message}</small>
              )}
            </div>

            {/* Referencia */}
            <div className="field col-12 md:col-6">
              <label htmlFor="referencia" className="font-medium text-900">
                Referencia
              </label>
              <InputText
                id="referencia"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("referencia")}
              />
              {errors.referencia && (
                <small className="p-error">{errors.referencia.message}</small>
              )}
            </div>

            {/* Artículo */}
            <div className="field col-12 md:col-6">
              <label htmlFor="item" className="font-medium text-900">
                Artículo <span className="text-red-500">*</span>
              </label>
              <Controller
                name="item"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="item"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={itemOptions}
                    placeholder="Seleccione un artículo"
                    filter
                    className={classNames("w-full", {
                      "p-invalid": errors.item,
                    })}
                  />
                )}
              />
              {errors.item && (
                <small className="p-error">{errors.item.message}</small>
              )}
            </div>

            {/* Cantidad */}
            <div className="field col-12 md:col-3">
              <label htmlFor="cantidad" className="font-medium text-900">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="cantidad"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={1}
                    className={classNames("w-full", {
                      "p-invalid": errors.cantidad,
                    })}
                  />
                )}
              />
              {errors.cantidad && (
                <small className="p-error">{errors.cantidad.message}</small>
              )}
            </div>

            {/* Costo Unitario */}
            <div className="field col-12 md:col-3">
              <label htmlFor="costoUnitario" className="font-medium text-900">
                Costo Unitario
              </label>
              <Controller
                name="costoUnitario"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="costoUnitario"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    className={classNames("w-full", {
                      "p-invalid": errors.costoUnitario,
                    })}
                  />
                )}
              />
              {errors.costoUnitario && (
                <small className="p-error">
                  {errors.costoUnitario.message}
                </small>
              )}
            </div>

            {/* Almacén Origen */}
            {showWarehouseFrom && (
              <div className="field col-12 md:col-6">
                <label htmlFor="warehouseFrom" className="font-medium text-900">
                  Almacén Origen{" "}
                  {selectedTipo === "transferencia" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <Controller
                  name="warehouseFrom"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="warehouseFrom"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={warehouseOptions}
                      placeholder="Seleccione un almacén"
                      filter
                      className={classNames("w-full", {
                        "p-invalid": errors.warehouseFrom,
                      })}
                    />
                  )}
                />
                {errors.warehouseFrom && (
                  <small className="p-error">
                    {errors.warehouseFrom.message}
                  </small>
                )}
              </div>
            )}

            {/* Almacén Destino */}
            {showWarehouseTo && (
              <div className="field col-12 md:col-6">
                <label htmlFor="warehouseTo" className="font-medium text-900">
                  Almacén Destino{" "}
                  {selectedTipo === "transferencia" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <Controller
                  name="warehouseTo"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="warehouseTo"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={warehouseOptions}
                      placeholder="Seleccione un almacén"
                      filter
                      className={classNames("w-full", {
                        "p-invalid": errors.warehouseTo,
                      })}
                    />
                  )}
                />
                {errors.warehouseTo && (
                  <small className="p-error">
                    {errors.warehouseTo.message}
                  </small>
                )}
              </div>
            )}

            {/* Lote */}
            <div className="field col-12">
              <label htmlFor="lote" className="font-medium text-900">
                Lote
              </label>
              <InputText
                id="lote"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("lote")}
              />
              {errors.lote && (
                <small className="p-error">{errors.lote.message}</small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={movement ? "Actualizar" : "Crear"}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="p-button-success"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MovementForm;
