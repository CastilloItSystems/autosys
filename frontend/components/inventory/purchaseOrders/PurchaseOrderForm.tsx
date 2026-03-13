"use client";
import React, { useContext, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import {
  purchaseOrderSchema,
  PurchaseOrderFormData,
} from "@/libs/zods/inventory";
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import type { PurchaseOrder } from "@/libs/interfaces/inventory";
import type { Item } from "@/app/api/inventory/itemService";
import type { Supplier } from "@/app/api/inventory/supplierService";
import type { Warehouse } from "@/app/api/inventory/warehouseService";

/* ── Props ── */
interface PurchaseOrderFormProps {
  purchaseOrder: PurchaseOrder | null;
  hideFormDialog: () => void;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
}

const PurchaseOrderForm = ({
  purchaseOrder,
  toast,
  hideFormDialog,
  purchaseOrders,
  setPurchaseOrders,
  showToast,
  items,
  suppliers,
  warehouses,
}: PurchaseOrderFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const isEditing = !!purchaseOrder;
  const isDraft = !purchaseOrder || purchaseOrder.status === "DRAFT";

  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: purchaseOrder?.supplierId || "",
      warehouseId: purchaseOrder?.warehouseId || "",
      notes: purchaseOrder?.notes || "",
      expectedDate: purchaseOrder?.expectedDate
        ? new Date(purchaseOrder.expectedDate)
        : undefined,
      items: purchaseOrder?.items?.map((i) => ({
        itemId: i.itemId,
        quantityOrdered: i.quantityOrdered,
        unitCost: i.unitCost,
      })) || [{ itemId: "", quantityOrdered: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const calculateTotal = () => {
    if (!watchItems) return 0;
    return watchItems.reduce(
      (sum, it) => sum + (it.quantityOrdered || 0) * (it.unitCost || 0),
      0,
    );
  };

  /* ── Submit ── */
  const onSubmit = async (data: PurchaseOrderFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        notes: data.notes || undefined,
        expectedDate: data.expectedDate
          ? new Date(data.expectedDate).toISOString()
          : undefined,
        items: data.items.map((item) => ({
          itemId: item.itemId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
        })),
      };

      if (isEditing && purchaseOrder) {
        showToast(
          "info" as any,
          "Edición",
          "Solo se pueden editar órdenes en borrador.",
        );
      } else {
        const result = await purchaseOrderService.create(payload);
        const newPO = result.data || result;
        setPurchaseOrders([newPO, ...purchaseOrders]);
        showToast("success", "Éxito", "Orden de compra creada");
        hideFormDialog();
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Opciones de dropdowns ── */
  const itemOptions = items.map((item) => ({
    label: item.sku ? `${item.sku} — ${item.name}` : item.name,
    value: item.id,
  }));

  const supplierOptions = suppliers.map((s) => ({
    label: s.code ? `${s.code} — ${s.name}` : s.name,
    value: s.id,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: `${w.code} — ${w.name}`,
    value: w.id,
  }));

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-shopping-cart mr-3 text-primary text-3xl"></i>
                {isEditing
                  ? "Modificar Orden de Compra"
                  : "Crear Orden de Compra"}
              </h2>
              {!isDraft && isEditing && (
                <p className="text-orange-500 text-sm mt-1">
                  <i className="pi pi-exclamation-triangle mr-1"></i>
                  Solo se pueden editar órdenes en estado Borrador
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="grid formgrid row-gap-2">
            {/* Proveedor */}
            <div className="field col-12 md:col-4">
              <label htmlFor="supplierId" className="font-medium text-900">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="supplierId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={supplierOptions}
                    placeholder="Seleccione un proveedor"
                    filter
                    disabled={!isDraft}
                    className={classNames("w-full", {
                      "p-invalid": errors.supplierId,
                    })}
                  />
                )}
              />
              {errors.supplierId && (
                <small className="p-error">{errors.supplierId.message}</small>
              )}
            </div>

            {/* Almacén */}
            <div className="field col-12 md:col-4">
              <label htmlFor="warehouseId" className="font-medium text-900">
                Almacén Destino <span className="text-red-500">*</span>
              </label>
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="warehouseId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={warehouseOptions}
                    placeholder="Seleccione un almacén"
                    filter
                    disabled={!isDraft}
                    className={classNames("w-full", {
                      "p-invalid": errors.warehouseId,
                    })}
                  />
                )}
              />
              {errors.warehouseId && (
                <small className="p-error">{errors.warehouseId.message}</small>
              )}
            </div>

            {/* Fecha esperada */}
            <div className="field col-12 md:col-4">
              <label htmlFor="expectedDate" className="font-medium text-900">
                Fecha Estimada de Entrega
              </label>
              <Controller
                name="expectedDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="expectedDate"
                    value={field.value ? new Date(field.value as string) : null}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    minDate={new Date()}
                    className={classNames("w-full", {
                      "p-invalid": errors.expectedDate,
                    })}
                  />
                )}
              />
            </div>

            {/* Notas */}
            <div className="field col-12">
              <label htmlFor="notes" className="font-medium text-900">
                Notas / Observaciones
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="notes"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={2}
                    autoResize
                    className="w-full"
                    placeholder="Observaciones para la orden..."
                  />
                )}
              />
            </div>

            {/* Items */}
            <div className="field col-12">
              <div className="flex align-items-center justify-content-between mb-2">
                <label className="font-medium text-900">
                  Artículos <span className="text-red-500">*</span>
                </label>
                {isDraft && (
                  <Button
                    type="button"
                    label="Agregar Artículo"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    onClick={() =>
                      append({
                        itemId: "",
                        quantityOrdered: 1,
                        unitCost: 0,
                      })
                    }
                  />
                )}
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid formgrid p-3 mb-2 border-1 border-round surface-border"
                >
                  {/* Artículo */}
                  <div className="field col-12 md:col-5">
                    <label className="font-medium text-900 text-sm">
                      Artículo
                    </label>
                    <Controller
                      name={`items.${index}.itemId`}
                      control={control}
                      render={({ field: f }) => (
                        <Dropdown
                          value={f.value}
                          onChange={(e) => f.onChange(e.value)}
                          options={itemOptions}
                          placeholder="Seleccione un artículo"
                          filter
                          disabled={!isDraft}
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.itemId,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.itemId && (
                      <small className="p-error">
                        {errors.items[index]?.itemId?.message}
                      </small>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="field col-12 md:col-2">
                    <label className="font-medium text-900 text-sm">
                      Cantidad
                    </label>
                    <Controller
                      name={`items.${index}.quantityOrdered`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value)}
                          min={1}
                          disabled={!isDraft}
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.quantityOrdered,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.quantityOrdered && (
                      <small className="p-error">
                        {errors.items[index]?.quantityOrdered?.message}
                      </small>
                    )}
                  </div>

                  {/* Costo Unitario */}
                  <div className="field col-12 md:col-2">
                    <label className="font-medium text-900 text-sm">
                      Costo Unit.
                    </label>
                    <Controller
                      name={`items.${index}.unitCost`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value)}
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          disabled={!isDraft}
                          className={classNames("w-full", {
                            "p-invalid": errors.items?.[index]?.unitCost,
                          })}
                        />
                      )}
                    />
                    {errors.items?.[index]?.unitCost && (
                      <small className="p-error">
                        {errors.items[index]?.unitCost?.message}
                      </small>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="field col-12 md:col-2">
                    <label className="font-medium text-900 text-sm">
                      Subtotal
                    </label>
                    <div className="text-900 font-bold mt-2">
                      $
                      {(
                        (watchItems?.[index]?.quantityOrdered || 0) *
                        (watchItems?.[index]?.unitCost || 0)
                      ).toFixed(2)}
                    </div>
                  </div>

                  {/* Eliminar */}
                  <div className="field col-12 md:col-1 flex align-items-end">
                    {isDraft && (
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              ))}

              {errors.items && typeof errors.items.message === "string" && (
                <small className="p-error">{errors.items.message}</small>
              )}
            </div>

            {/* Total */}
            <div className="field col-12">
              <div className="flex justify-content-end">
                <div className="surface-100 border-round p-3 text-right">
                  <span className="text-500 mr-3">Total Estimado:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="field col-12 flex justify-content-end gap-2">
              <Button
                type="button"
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text"
                onClick={hideFormDialog}
              />
              {isDraft && (
                <Button
                  type="submit"
                  label={isEditing ? "Actualizar" : "Crear Orden"}
                  icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                  className="p-button-success"
                  disabled={submitting}
                />
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
