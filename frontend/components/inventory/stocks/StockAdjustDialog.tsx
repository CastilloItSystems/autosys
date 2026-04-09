"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import FormActionButtons from "@/components/common/FormActionButtons";
import stockService, { Stock } from "@/app/api/inventory/stockService";
import { adjustStockSchema, AdjustStock } from "@/libs/zods/inventory/stockZod";
import { handleFormError } from "@/utils/errorHandlers";

interface StockAdjustDialogProps {
  visible: boolean;
  stock: Stock | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
  onSubmittingChange?: (submitting: boolean) => void;
  formId?: string;
}

export default function StockAdjustDialog({
  visible,
  stock,
  onSave,
  onCancel,
  toast,
  onSubmittingChange,
  formId = "adjust-stock-form",
}: StockAdjustDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<AdjustStock>({
    resolver: zodResolver(adjustStockSchema),
    mode: "onBlur",
    defaultValues: {
      itemId: stock?.itemId || "",
      warehouseId: stock?.warehouseId || "",
      quantityChange: 0,
      reason: "",
    },
  });

  // Reset form when stock changes
  React.useEffect(() => {
    if (stock) {
      reset({
        itemId: stock.itemId,
        warehouseId: stock.warehouseId,
        quantityChange: 0,
        reason: "",
      });
    }
  }, [stock, reset]);

  const onSubmit = async (data: AdjustStock) => {
    setSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      await stockService.adjust(stock?.id || "", {
        quantityChange: data.quantityChange,
        reason: data.reason,
      });
      reset();
      onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "500px" }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-sliders-h mr-3 text-primary text-3xl"></i>
              Ajustar Stock
            </h2>
          </div>
        </div>
      }
      modal
      className="p-fluid"
      footer={
        <FormActionButtons
          formId={formId}
          isSubmitting={submitting}
          onCancel={() => {
            reset();
            onCancel();
          }}
        />
      }
      onHide={() => {
        reset();
        onCancel();
      }}
    >
      {stock && (
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <div className="p-3">
            {/* Info del stock actual */}
            <div className="surface-100 border-round p-3 mb-3">
              <div className="grid">
                <div className="col-6">
                  <span className="text-500 text-sm">Artículo</span>
                  <p className="font-semibold m-0 mt-1">
                    {stock.item?.name || stock.itemId}
                  </p>
                </div>
                <div className="col-6">
                  <span className="text-500 text-sm">Almacén</span>
                  <p className="font-semibold m-0 mt-1">
                    {stock.warehouse?.name || stock.warehouseId}
                  </p>
                </div>
                <div className="col-4">
                  <span className="text-500 text-sm">Cantidad Real</span>
                  <p className="font-bold text-xl m-0 mt-1">
                    {stock.quantityReal}
                  </p>
                </div>
                <div className="col-4">
                  <span className="text-500 text-sm">Disponible</span>
                  <p className="font-bold text-xl m-0 mt-1 text-primary">
                    {stock.quantityAvailable}
                  </p>
                </div>
                <div className="col-4">
                  <span className="text-500 text-sm">Reservado</span>
                  <p className="font-bold text-xl m-0 mt-1">
                    {stock.quantityReserved}
                  </p>
                </div>
              </div>
            </div>

            {/* Cantidad de ajuste */}
            <div className="field mb-3">
              <label
                htmlFor="quantityChange"
                className="font-medium text-900 mb-2 block"
              >
                Cantidad de Ajuste <span className="text-red-500">*</span>
              </label>
              <span className="text-500 text-sm block mb-2">
                Use valores positivos para agregar y negativos para restar
              </span>
              <Controller
                name="quantityChange"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="quantityChange"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    showButtons
                    buttonLayout="horizontal"
                    decrementButtonClassName="p-button-danger"
                    incrementButtonClassName="p-button-success"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    className={classNames("w-full", {
                      "p-invalid": errors.quantityChange,
                    })}
                  />
                )}
              />
              {errors.quantityChange && (
                <small className="p-error">
                  {errors.quantityChange.message}
                </small>
              )}
            </div>

            {/* Razón */}
            <div className="field mb-3">
              <label
                htmlFor="reason"
                className="font-medium text-900 mb-2 block"
              >
                Razón del Ajuste <span className="text-red-500">*</span>
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="reason"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={3}
                    autoResize
                    placeholder="Describa la razón del ajuste..."
                    className={classNames("w-full", {
                      "p-invalid": errors.reason,
                    })}
                  />
                )}
              />
              {errors.reason && (
                <small className="p-error">{errors.reason.message}</small>
              )}
            </div>

            {/* Resultado proyectado */}
            {stock && (
              <div className="surface-50 border-round p-2 mb-3">
                <span className="text-500 text-sm">
                  Resultado proyectado:{" "}
                  <span className="font-bold text-900">
                    {stock.quantityReal} → ???
                  </span>{" "}
                  (ingrese la cantidad de ajuste)
                </span>
              </div>
            )}
          </div>
        </form>
      )}
    </Dialog>
  );
}
