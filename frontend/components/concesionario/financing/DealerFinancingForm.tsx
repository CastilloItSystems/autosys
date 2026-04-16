"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerFinancingService from "@/app/api/dealer/dealerFinancingService";
import type { DealerFinancing } from "@/libs/interfaces/dealer/dealerFinancing.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SUBMITTED" },
  { label: "En revisión", value: "UNDER_REVIEW" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Desembolsada", value: "DISBURSED" },
];

type DealerFinancingFormValues = {
  dealerUnitId: string;
  customerName: string;
  bankName: string;
  requestedAmount?: number;
  approvedAmount?: number;
  termMonths?: number;
  status: string;
};

interface DealerFinancingFormProps {
  financing: DealerFinancing | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerFinancingForm({
  financing,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerFinancingFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerFinancingFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: financing?.dealerUnit?.id || "",
      customerName: financing?.customerName || "",
      bankName: "",
      requestedAmount:
        financing?.requestedAmount != null ? Number(financing.requestedAmount) : undefined,
      approvedAmount:
        financing?.approvedAmount != null ? Number(financing.approvedAmount) : undefined,
      termMonths: financing?.termMonths ?? undefined,
      status: financing?.status || "DRAFT",
    },
  });

  const onSubmit = async (data: DealerFinancingFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        dealerUnitId: data.dealerUnitId,
        customerName: data.customerName.trim(),
        bankName: data.bankName || null,
        requestedAmount: data.requestedAmount ?? null,
        approvedAmount: data.approvedAmount ?? null,
        termMonths: data.termMonths ?? null,
        status: data.status,
      };

      if (financing?.id) {
        await dealerFinancingService.update(financing.id, payload);
      } else {
        await dealerFinancingService.create(payload);
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
      id={formId || "dealer-financing-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
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
          <label className="font-semibold">Banco</label>
          <Controller
            name="bankName"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Monto solicitado</label>
          <Controller
            name="requestedAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Monto aprobado</label>
          <Controller
            name="approvedAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field mb-0">
          <label className="font-semibold">Plazo (meses)</label>
          <Controller
            name="termMonths"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                useGrouping={false}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
