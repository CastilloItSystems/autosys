"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerDeliveryService from "@/app/api/dealer/dealerDeliveryService";
import type { DealerDelivery } from "@/libs/interfaces/dealer/dealerDelivery.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Programada", value: "SCHEDULED" },
  { label: "Lista", value: "READY" },
  { label: "Entregada", value: "DELIVERED" },
  { label: "Cancelada", value: "CANCELLED" },
];

type DealerDeliveryFormValues = {
  dealerUnitId: string;
  customerName: string;
  scheduledAt: Date | null;
  status: string;
};

interface DealerDeliveryFormProps {
  delivery: DealerDelivery | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerDeliveryForm({
  delivery,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerDeliveryFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerDeliveryFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: delivery?.dealerUnit?.id || "",
      customerName: delivery?.customerName || "",
      scheduledAt: delivery?.scheduledAt ? new Date(delivery.scheduledAt) : null,
      status: delivery?.status || "SCHEDULED",
    },
  });

  const onSubmit = async (data: DealerDeliveryFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        dealerUnitId: data.dealerUnitId,
        customerName: data.customerName.trim(),
        scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : "",
        status: data.status,
      };
      if ((delivery as any)?.id) {
        await dealerDeliveryService.update((delivery as any).id, payload);
      } else {
        await dealerDeliveryService.create(payload);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  return (
    <form
      id={formId || "dealer-delivery-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 field">
          <label className="font-semibold">Unidad *</label>
          <Controller
            name="dealerUnitId"
            control={control}
            rules={{ required: "Unidad requerida" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={unitOptions}
                className={errors.dealerUnitId ? "p-invalid" : ""}
                filter
              />
            )}
          />
          {errors.dealerUnitId && (
            <small className="p-error">{errors.dealerUnitId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Cliente *</label>
          <Controller
            name="customerName"
            control={control}
            rules={{ required: "Cliente requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.customerName ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.customerName && (
            <small className="p-error">{errors.customerName.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Fecha y hora programada *</label>
          <Controller
            name="scheduledAt"
            control={control}
            rules={{ required: "Fecha requerida" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showTime
                hourFormat="24"
                showIcon
                className={errors.scheduledAt ? "p-invalid" : ""}
              />
            )}
          />
          {errors.scheduledAt && (
            <small className="p-error">{errors.scheduledAt.message}</small>
          )}
        </div>
      </div>
    </form>
  );
}
