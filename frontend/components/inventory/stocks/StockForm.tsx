"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { stockSchema } from "@/libs/zods/inventory";
import { createStock, updateStock } from "@/app/api/inventory/stockService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Item, Warehouse } from "@/libs/interfaces/inventory";

type FormData = z.infer<typeof stockSchema>;

interface StockFormProps {
  stock: any;
  hideFormDialog: () => void;
  stocks: any[];
  setStocks: (stocks: any[]) => void;
  setStock: (stock: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

const StockForm = ({
  stock,
  toast,
  hideFormDialog,
  stocks,
  setStocks,
  showToast,
  items,
  warehouses,
}: StockFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      cantidad: 0,
      costoPromedio: 0,
      reservado: 0,
    },
  });

  useEffect(() => {
    if (stock) {
      Object.keys(stock).forEach((key) =>
        setValue(key as keyof FormData, stock[key])
      );
    }
  }, [stock, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (stock) {
        const updatedStock = await updateStock(stock.id, data);
        const updatedStocks = stocks.map((t) =>
          t.id === updatedStock.id ? updatedStock : t
        );
        setStocks(updatedStocks);
        showToast("success", "Éxito", "Stock actualizado");
      } else {
        const newStock = await createStock(data);
        setStocks([...stocks, newStock]);
        showToast("success", "Éxito", "Stock creado");
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

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-chart-bar mr-3 text-primary text-3xl"></i>
                {stock ? "Modificar Stock" : "Crear Stock"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
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

            {/* Almacén */}
            <div className="field col-12 md:col-6">
              <label htmlFor="warehouse" className="font-medium text-900">
                Almacén <span className="text-red-500">*</span>
              </label>
              <Controller
                name="warehouse"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="warehouse"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={warehouseOptions}
                    placeholder="Seleccione un almacén"
                    filter
                    className={classNames("w-full", {
                      "p-invalid": errors.warehouse,
                    })}
                  />
                )}
              />
              {errors.warehouse && (
                <small className="p-error">{errors.warehouse.message}</small>
              )}
            </div>

            {/* Cantidad */}
            <div className="field col-12 md:col-3">
              <label htmlFor="cantidad" className="font-medium text-900">
                Cantidad
              </label>
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="cantidad"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
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

            {/* Costo Promedio */}
            <div className="field col-12 md:col-3">
              <label htmlFor="costoPromedio" className="font-medium text-900">
                Costo Promedio
              </label>
              <Controller
                name="costoPromedio"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="costoPromedio"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    className={classNames("w-full", {
                      "p-invalid": errors.costoPromedio,
                    })}
                  />
                )}
              />
              {errors.costoPromedio && (
                <small className="p-error">
                  {errors.costoPromedio.message}
                </small>
              )}
            </div>

            {/* Reservado */}
            <div className="field col-12 md:col-3">
              <label htmlFor="reservado" className="font-medium text-900">
                Reservado
              </label>
              <Controller
                name="reservado"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="reservado"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    className={classNames("w-full", {
                      "p-invalid": errors.reservado,
                    })}
                  />
                )}
              />
              {errors.reservado && (
                <small className="p-error">{errors.reservado.message}</small>
              )}
            </div>

            {/* Lote */}
            <div className="field col-12 md:col-3">
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

            {/* Ubicación/Zona */}
            <div className="field col-12">
              <label htmlFor="ubicacionZona" className="font-medium text-900">
                Ubicación/Zona
              </label>
              <InputText
                id="ubicacionZona"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("ubicacionZona")}
              />
              {errors.ubicacionZona && (
                <small className="p-error">
                  {errors.ubicacionZona.message}
                </small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={stock ? "Actualizar" : "Crear"}
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

export default StockForm;
