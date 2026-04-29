"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import customerCrmService from "@/modules/crm/customer/services/customerCrmService";
import dealerDeliveryService from "../services/dealerDeliveryService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  DealerDeliveryFormValues,
  DealerDeliveryFormProps,
} from "../interfaces/dealerDeliveryForm.interface";
import { DELIVERY_STATUS_OPTIONS } from "../utils/dealerDelivery.utils";

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
    setValue,
    formState: { errors },
  } = useForm<DealerDeliveryFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: delivery?.dealerUnit?.id || "",
      customerId: delivery?.customerId || "",
      customerName: delivery?.customerName || "",
      scheduledAt: delivery?.scheduledAt
        ? new Date(delivery.scheduledAt)
        : null,
      status: delivery?.status || "SCHEDULED",
    },
  });

  const onSubmit = async (data: DealerDeliveryFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
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

  const handleCustomerChange = async (
    customerId: string | null,
    onChange: (value: string) => void,
  ) => {
    const id = customerId ?? "";
    onChange(id);
    if (!id) {
      setValue("customerName", "");
      return;
    }
    try {
      const res = await customerCrmService.getById(id);
      const customer = res?.data;
      if (customer) {
        setValue("customerName", customer.name || "");
      }
    } catch {
      // noop
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
          <label className="font-semibold">Cliente CRM *</label>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: "Cliente requerido" }}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={(value) =>
                  handleCustomerChange(value, field.onChange)
                }
                invalid={!!errors.customerId}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
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
                options={DELIVERY_STATUS_OPTIONS}
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
