"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerTradeInService from "@/app/api/dealer/dealerTradeInService";
import type { DealerTradeIn } from "@/libs/interfaces/dealer/dealerTradeIn.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Inspeccionada", value: "INSPECTED" },
  { label: "Valorada", value: "VALUED" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Aplicada", value: "APPLIED" },
];

type DealerTradeInFormValues = {
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  requestedValue?: number;
  appraisedValue?: number;
  approvedValue?: number;
  status: string;
};

interface DealerTradeInFormProps {
  tradeIn: DealerTradeIn | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerTradeInForm({
  tradeIn,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerTradeInFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerTradeInFormValues>({
    mode: "onBlur",
    defaultValues: {
      customerName: tradeIn?.customerName || "",
      vehicleBrand: tradeIn?.vehicleBrand || "",
      vehicleModel: tradeIn?.vehicleModel || "",
      requestedValue:
        tradeIn?.requestedValue != null ? Number(tradeIn.requestedValue) : undefined,
      appraisedValue:
        tradeIn?.appraisedValue != null ? Number(tradeIn.appraisedValue) : undefined,
      approvedValue:
        tradeIn?.approvedValue != null ? Number(tradeIn.approvedValue) : undefined,
      status: tradeIn?.status || "PENDING",
    },
  });

  const onSubmit = async (data: DealerTradeInFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        customerName: data.customerName.trim(),
        vehicleBrand: data.vehicleBrand.trim(),
        vehicleModel: data.vehicleModel || null,
        requestedValue: data.requestedValue ?? null,
        appraisedValue: data.appraisedValue ?? null,
        approvedValue: data.approvedValue ?? null,
        status: data.status,
      };

      if (tradeIn?.id) {
        await dealerTradeInService.update(tradeIn.id, payload);
      } else {
        await dealerTradeInService.create(payload);
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
      id={formId || "dealer-trade-in-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
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

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Marca vehículo *</label>
          <Controller
            name="vehicleBrand"
            control={control}
            rules={{ required: "Marca requerida" }}
            render={({ field }) => (
              <InputText {...field} className={errors.vehicleBrand ? "p-invalid" : ""} />
            )}
          />
          {errors.vehicleBrand && (
            <small className="p-error">{errors.vehicleBrand.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Modelo vehículo</label>
          <Controller
            name="vehicleModel"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Valor solicitado</label>
          <Controller
            name="requestedValue"
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
          <label className="font-semibold">Valor avalúo</label>
          <Controller
            name="appraisedValue"
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
          <label className="font-semibold">Valor aprobado</label>
          <Controller
            name="approvedValue"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
