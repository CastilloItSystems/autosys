"use client";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classNames } from "primereact/utils";
import {
  reservationSchema,
  ReservationFormData,
} from "@/libs/zods/inventory/reservationZod";
import reservationService from "@/app/api/inventory/reservationService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { handleFormError } from "@/utils/errorHandlers";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import { Reservation } from "@/libs/interfaces/inventory/reservation.interface";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import SaleOrderSelector from "@/components/common/SaleOrderSelector";

interface ReservationFormProps {
  reservation: Reservation | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
  items: Item[];
  warehouses: Warehouse[];
}

const ReservationForm = ({
  reservation,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  warehouses,
}: ReservationFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: reservation
      ? {
          itemId: reservation.itemId,
          warehouseId: reservation.warehouseId,
          quantity: reservation.quantity,
          workOrderId: reservation.workOrderId,
          saleOrderId: reservation.saleOrderId,
          reference: reservation.reference,
          notes: reservation.notes,
          expiresAt: reservation.expiresAt
            ? new Date(reservation.expiresAt)
            : undefined,
        }
      : {
          quantity: 1,
        },
  });

  const onSubmit = async (data: ReservationFormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      // Clean up null values for compatibility with backend
      const cleanedData = {
        ...data,
        expiresAt: data.expiresAt || undefined,
      } as any;

      if (reservation?.id) {
        await reservationService.update(reservation.id, cleanedData);
      } else {
        await reservationService.create(cleanedData as any);
      }
      await onSave();
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const itemOptions = items.map((item) => ({
    label:
      item.sku || item.code
        ? `${item.sku || item.code} - ${item.name}`
        : item.name,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    label: warehouse.name,
    value: warehouse.id,
  }));

  return (
    <form id={formId || "reservation-form"} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid formgrid row-gap-2">
        {/* Item Selection */}
        <div className="field col-12 md:col-6">
          <label htmlFor="itemId" className="font-medium text-900">
            Producto <span className="text-red-500">*</span>
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
                placeholder="Seleccione un producto"
                filter
                className={classNames("w-full", {
                  "p-invalid": errors.itemId,
                })}
              />
            )}
          />
          {errors.itemId && (
            <small className="p-error">{errors.itemId.message}</small>
          )}
        </div>

        {/* Warehouse Selection */}
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
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un almacén"
                filter
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

        {/* Quantity */}
        <div className="field col-12 md:col-4">
          <label htmlFor="quantity" className="font-medium text-900">
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
                })}
              />
            )}
          />
          {errors.quantity && (
            <small className="p-error">{errors.quantity.message}</small>
          )}
        </div>

        {/* Work Order ID (Optional) */}
        <div className="field col-12 md:col-4">
          <label htmlFor="workOrderId" className="font-medium text-900">
            Orden de Trabajo
          </label>
          <Controller
            name="workOrderId"
            control={control}
            render={({ field }) => (
              <ServiceOrderSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.workOrderId}
              />
            )}
          />
          {errors.workOrderId && (
            <small className="p-error">{errors.workOrderId.message}</small>
          )}
        </div>

        {/* Sale Order ID (Optional) */}
        <div className="field col-12 md:col-4">
          <label htmlFor="saleOrderId" className="font-medium text-900">
            Orden de Venta
          </label>
          <Controller
            name="saleOrderId"
            control={control}
            render={({ field }) => (
              <SaleOrderSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.saleOrderId}
              />
            )}
          />
          {errors.saleOrderId && (
            <small className="p-error">{errors.saleOrderId.message}</small>
          )}
        </div>

        {/* Reference */}
        <div className="field col-12">
          <label htmlFor="reference" className="font-medium text-900">
            Referencia
          </label>
          <InputText
            id="reference"
            type="text"
            placeholder="Referencia adicional"
            className="w-full"
            {...register("reference")}
          />
          {errors.reference && (
            <small className="p-error">{errors.reference.message}</small>
          )}
        </div>

        {/* Expiration Date (Optional) */}
        <div className="field col-12 md:col-6">
          <label htmlFor="expiresAt" className="font-medium text-900">
            Fecha de Vencimiento
          </label>
          <Controller
            name="expiresAt"
            control={control}
            render={({ field }) => (
              <Calendar
                id="expiresAt"
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames("w-full", {
                  "p-invalid": errors.expiresAt,
                })}
              />
            )}
          />
          {errors.expiresAt && (
            <small className="p-error">{errors.expiresAt.message}</small>
          )}
        </div>

        {/* Notes */}
        <div className="field col-12">
          <label htmlFor="notes" className="font-medium text-900">
            Notas
          </label>
          <InputTextarea
            id="notes"
            rows={3}
            placeholder="Notas adicionales"
            className="w-full"
            {...register("notes")}
          />
          {errors.notes && (
            <small className="p-error">{errors.notes.message}</small>
          )}
        </div>
      </div>
    </form>
  );
};

export default ReservationForm;
