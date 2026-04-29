"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import customerCrmService from "@/app/api/crm/customerCrmService";
import dealerAfterSaleService from "../services/dealerAfterSaleService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  DealerAfterSaleFormValues,
  DealerAfterSaleFormProps,
} from "../interfaces/dealerAfterSale.interface";
import {
  AFTER_SALE_TYPE_OPTIONS,
  AFTER_SALE_STATUS_OPTIONS,
} from "../utils/dealerAfterSale.utils";

export default function DealerAfterSaleForm({
  afterSale,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerAfterSaleFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DealerAfterSaleFormValues>({
    mode: "onBlur",
    defaultValues: {
      type: afterSale?.type || "WARRANTY_CHECK",
      status: afterSale?.status || "OPEN",
      customerId: (afterSale as any)?.customerId || "",
      customerName: afterSale?.customerName || "",
      title: afterSale?.title || "",
      description: "",
      dueAt: afterSale?.dueAt ? new Date(afterSale.dueAt) : null,
      satisfactionScore: afterSale?.satisfactionScore ?? undefined,
    },
  });

  const onSubmit = async (data: DealerAfterSaleFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        type: data.type,
        status: data.status,
        customerId: data.customerId,
        customerName: data.customerName.trim(),
        title: data.title.trim(),
        description: data.description?.trim() || null,
        dueAt: data.dueAt ? data.dueAt.toISOString() : null,
        satisfactionScore: data.satisfactionScore ?? null,
      };

      if (afterSale?.id) {
        await dealerAfterSaleService.update(afterSale.id, payload);
      } else {
        await dealerAfterSaleService.create(payload);
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
      id={formId || "dealer-after-sale-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo *</label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Tipo requerido" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={AFTER_SALE_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus *</label>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Estatus requerido" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={AFTER_SALE_STATUS_OPTIONS}
                optionLabel="label"
                optionValue="value"
                className={errors.status ? "p-invalid" : ""}
              />
            )}
          />
          {errors.status && (
            <small className="p-error">{errors.status.message}</small>
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
          <label className="font-semibold">Fecha objetivo</label>
          <Controller
            name="dueAt"
            control={control}
            render={({ field }) => (
              <Calendar
                showIcon
                dateFormat="yy-mm-dd"
                value={field.value ?? null}
                onChange={(e) => field.onChange((e.value as Date) || null)}
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Título *</label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Título requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.title ? "p-invalid" : ""}
                placeholder="Ej: Seguimiento primer servicio 1.000 km"
              />
            )}
          />
          {errors.title && (
            <small className="p-error">{errors.title.message}</small>
          )}
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Descripción</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field mb-0">
          <label className="font-semibold">Satisfacción (1-5)</label>
          <Controller
            name="satisfactionScore"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={1}
                max={5}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
