"use client";

import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import type { Toast } from "primereact/toast";
import {
  dealerCommissionEditSchema,
  type DealerCommissionEditSchema,
} from "../schemas/dealerCommission.schema";
import { COMMISSION_STATUS_OPTIONS } from "../utils/dealerCommission.utils";
import type { DealerCommission } from "../interfaces/dealerCommission.interface";
import dealerCommissionService from "../services/dealerCommissionService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  commission: DealerCommission;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerCommissionForm({
  commission,
  formId = "dealer-commission-form",
  onSave,
  onSubmittingChange,
  toast,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealerCommissionEditSchema>({
    resolver: zodResolver(dealerCommissionEditSchema),
    mode: "onBlur",
    defaultValues: {
      status: commission.status,
      commissionPct: Number(commission.commissionPct ?? 0),
      sellerName: commission.sellerName ?? "",
      notes: commission.notes ?? "",
    },
  });

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const onSubmit = async (values: DealerCommissionEditSchema) => {
    try {
      await dealerCommissionService.update(commission.id, {
        status: values.status,
        commissionPct: values.commissionPct,
        sellerName: values.sellerName || null,
        notes: values.notes || null,
      });
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid">
        <div className="field col-12 md:col-6">
          <label htmlFor="status" className="font-medium">
            Estatus
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="status"
                value={field.value}
                options={COMMISSION_STATUS_OPTIONS}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione estatus"
              />
            )}
          />
          {errors.status && (
            <small className="p-error">{errors.status.message}</small>
          )}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="commissionPct" className="font-medium">
            % Comisión
          </label>
          <Controller
            name="commissionPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="commissionPct"
                value={field.value ?? 0}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                suffix=" %"
              />
            )}
          />
          {errors.commissionPct && (
            <small className="p-error">{errors.commissionPct.message}</small>
          )}
        </div>

        <div className="field col-12">
          <label htmlFor="sellerName" className="font-medium">
            Asesor
          </label>
          <Controller
            name="sellerName"
            control={control}
            render={({ field }) => (
              <InputText
                id="sellerName"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Nombre del asesor"
              />
            )}
          />
        </div>

        <div className="field col-12">
          <label htmlFor="notes" className="font-medium">
            Observaciones
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                rows={3}
                autoResize
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
