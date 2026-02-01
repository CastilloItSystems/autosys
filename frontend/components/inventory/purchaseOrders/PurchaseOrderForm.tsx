"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { purchaseOrderSchema } from "@/libs/zods/inventory";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/app/api/inventory/purchaseOrderService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Item, Supplier } from "@/libs/interfaces/inventory";

type FormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  purchaseOrder: any;
  hideFormDialog: () => void;
  purchaseOrders: any[];
  setPurchaseOrders: (purchaseOrders: any[]) => void;
  setPurchaseOrder: (purchaseOrder: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  suppliers: Supplier[];
}

const estadoOptions = [
  { label: "Pendiente", value: "pendiente" },
  { label: "Parcial", value: "parcial" },
  { label: "Recibido", value: "recibido" },
  { label: "Cancelado", value: "cancelado" },
];

const PurchaseOrderForm = ({
  purchaseOrder,
  toast,
  hideFormDialog,
  purchaseOrders,
  setPurchaseOrders,
  showToast,
  items,
  suppliers,
}: PurchaseOrderFormProps) => {
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
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      estado: "pendiente",
      items: [
        {
          item: "",
          cantidad: 1,
          precioUnitario: 0,
          recibido: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (purchaseOrder) {
      Object.keys(purchaseOrder).forEach((key) => {
        if (key === "fecha" && purchaseOrder[key]) {
          setValue(key as keyof FormData, new Date(purchaseOrder[key]) as any);
        } else {
          setValue(key as keyof FormData, purchaseOrder[key]);
        }
      });
    }
  }, [purchaseOrder, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const formattedData = {
        ...data,
        fecha: data.fecha ? new Date(data.fecha).toISOString() : undefined,
      };

      if (purchaseOrder) {
        const updatedPurchaseOrder = await updatePurchaseOrder(
          purchaseOrder.id,
          formattedData
        );
        const updatedPurchaseOrders = purchaseOrders.map((t) =>
          t.id === updatedPurchaseOrder.id ? updatedPurchaseOrder : t
        );
        setPurchaseOrders(updatedPurchaseOrders);
        showToast("success", "Éxito", "Orden de compra actualizada");
      } else {
        const newPurchaseOrder = await createPurchaseOrder(formattedData);
        setPurchaseOrders([...purchaseOrders, newPurchaseOrder]);
        showToast("success", "Éxito", "Orden de compra creada");
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

  const supplierOptions = suppliers.map((supplier) => ({
    label: supplier.nombre,
    value: supplier.id,
  }));

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-shopping-cart mr-3 text-primary text-3xl"></i>
                {purchaseOrder
                  ? "Modificar Orden de Compra"
                  : "Crear Orden de Compra"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Número */}
            <div className="field col-12 md:col-4">
              <label htmlFor="numero" className="font-medium text-900">
                Número <span className="text-red-500">*</span>
              </label>
              <InputText
                id="numero"
                type="text"
                className={classNames("w-full", {
                  "p-invalid": errors.numero,
                  "p-filled": filledInput,
                })}
                {...register("numero")}
              />
              {errors.numero && (
                <small className="p-error">{errors.numero.message}</small>
              )}
            </div>

            {/* Proveedor */}
            <div className="field col-12 md:col-4">
              <label htmlFor="proveedor" className="font-medium text-900">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <Controller
                name="proveedor"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="proveedor"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={supplierOptions}
                    placeholder="Seleccione un proveedor"
                    filter
                    className={classNames("w-full", {
                      "p-invalid": errors.proveedor,
                    })}
                  />
                )}
              />
              {errors.proveedor && (
                <small className="p-error">{errors.proveedor.message}</small>
              )}
            </div>

            {/* Fecha */}
            <div className="field col-12 md:col-4">
              <label htmlFor="fecha" className="font-medium text-900">
                Fecha
              </label>
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fecha"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className={classNames("w-full", {
                      "p-invalid": errors.fecha,
                    })}
                  />
                )}
              />
              {errors.fecha && (
                <small className="p-error">{errors.fecha.message}</small>
              )}
            </div>

            {/* Estado */}
            <div className="field col-12">
              <label htmlFor="estado" className="font-medium text-900">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadoOptions}
                    placeholder="Seleccione un estado"
                    className={classNames("w-full", {
                      "p-invalid": errors.estado,
                    })}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error">{errors.estado.message}</small>
              )}
            </div>

            {/* Items */}
            <div className="field col-12">
              <div className="flex align-items-center justify-content-between mb-2">
                <label className="font-medium text-900">
                  Artículos <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  label="Agregar Artículo"
                  icon="pi pi-plus"
                  size="small"
                  onClick={() =>
                    append({
                      item: "",
                      cantidad: 1,
                      precioUnitario: 0,
                      recibido: 0,
                    })
                  }
                />
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid formgrid p-3 mb-2 border-1 border-round surface-border"
                >
                  <div className="field col-12 md:col-5">
                    <label
                      htmlFor={`items.${index}.item`}
                      className="font-medium text-900"
                    >
                      Artículo
                    </label>
                    <Controller
                      name={`items.${index}.item`}
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id={`items.${index}.item`}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          options={itemOptions}
                          placeholder="Seleccione un artículo"
                          filter
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.item,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.item && (
                      <small className="p-error">
                        {errors.items[index]?.item?.message}
                      </small>
                    )}
                  </div>

                  <div className="field col-12 md:col-2">
                    <label
                      htmlFor={`items.${index}.cantidad`}
                      className="font-medium text-900"
                    >
                      Cantidad
                    </label>
                    <Controller
                      name={`items.${index}.cantidad`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id={`items.${index}.cantidad`}
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          min={1}
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.cantidad,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.cantidad && (
                      <small className="p-error">
                        {errors.items[index]?.cantidad?.message}
                      </small>
                    )}
                  </div>

                  <div className="field col-12 md:col-2">
                    <label
                      htmlFor={`items.${index}.precioUnitario`}
                      className="font-medium text-900"
                    >
                      Precio
                    </label>
                    <Controller
                      name={`items.${index}.precioUnitario`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id={`items.${index}.precioUnitario`}
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.precioUnitario,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.precioUnitario && (
                      <small className="p-error">
                        {errors.items[index]?.precioUnitario?.message}
                      </small>
                    )}
                  </div>

                  <div className="field col-12 md:col-2">
                    <label
                      htmlFor={`items.${index}.recibido`}
                      className="font-medium text-900"
                    >
                      Recibido
                    </label>
                    <Controller
                      name={`items.${index}.recibido`}
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id={`items.${index}.recibido`}
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          min={0}
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.recibido,
                          })}
                        />
                      )}
                    />
                  </div>

                  <div className="field col-12 md:col-1 flex align-items-end">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}

              {errors.items && (
                <small className="p-error">
                  {typeof errors.items.message === "string"
                    ? errors.items.message
                    : "Debe incluir al menos un artículo"}
                </small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={purchaseOrder ? "Actualizar" : "Crear"}
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

export default PurchaseOrderForm;
