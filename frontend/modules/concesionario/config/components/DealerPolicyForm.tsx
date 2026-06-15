"use client";

import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  dealerPolicySchema,
  type DealerPolicySchema,
} from "../schemas/dealerPolicy.schema";
import { useDealerPolicyData } from "../hooks/useDealerPolicyData";
import dealerPolicyService from "../services/dealerPolicyService";
import { handleFormError } from "@/utils/errorHandlers";

const num = (v: string | number | null | undefined, fallback: number) =>
  v === null || v === undefined ? fallback : Number(v);

export default function DealerPolicyForm() {
  const toast = useRef<Toast>(null);
  const { policy, loading, mutate } = useDealerPolicyData();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealerPolicySchema>({
    resolver: zodResolver(dealerPolicySchema),
    mode: "onBlur",
    defaultValues: {
      quoteValidityDays: 15,
      reservationValidityDays: 7,
      minDepositAmount: null,
      minDepositPct: null,
      maxDiscountPctAdvisor: 0,
      maxDiscountPctSupervisor: 5,
      maxDiscountPctManager: 10,
      requireTestDrive: false,
      requireAppraisalForTradeIn: true,
      requireDepositForReservation: true,
      leadFollowUpSlaHours: 48,
      commissionPctDefault: 0,
      alertWindowHours: 48,
      notes: "",
    },
  });

  useEffect(() => {
    if (!policy) return;
    reset({
      quoteValidityDays: num(policy.quoteValidityDays, 15),
      reservationValidityDays: num(policy.reservationValidityDays, 7),
      minDepositAmount:
        policy.minDepositAmount != null ? Number(policy.minDepositAmount) : null,
      minDepositPct:
        policy.minDepositPct != null ? Number(policy.minDepositPct) : null,
      maxDiscountPctAdvisor: num(policy.maxDiscountPctAdvisor, 0),
      maxDiscountPctSupervisor: num(policy.maxDiscountPctSupervisor, 5),
      maxDiscountPctManager: num(policy.maxDiscountPctManager, 10),
      requireTestDrive: Boolean(policy.requireTestDrive),
      requireAppraisalForTradeIn: Boolean(policy.requireAppraisalForTradeIn),
      requireDepositForReservation: Boolean(policy.requireDepositForReservation),
      leadFollowUpSlaHours: num(policy.leadFollowUpSlaHours, 48),
      commissionPctDefault: num(policy.commissionPctDefault, 0),
      alertWindowHours: num(policy.alertWindowHours, 48),
      notes: policy.notes ?? "",
    });
  }, [policy, reset]);

  const onSubmit = async (values: DealerPolicySchema) => {
    try {
      await dealerPolicyService.upsert({
        ...values,
        notes: values.notes || null,
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Configuración comercial guardada correctamente",
        life: 3000,
      });
      await mutate();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const intField = (
    name: keyof DealerPolicySchema,
    label: string,
    suffix?: string,
    min = 0,
    max = 100000,
  ) => (
    <div className="field col-12 md:col-4">
      <label htmlFor={String(name)} className="font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputNumber
            id={String(name)}
            value={(field.value as number) ?? 0}
            onValueChange={(e) => field.onChange(e.value ?? 0)}
            min={min}
            max={max}
            suffix={suffix}
          />
        )}
      />
      {errors[name] && (
        <small className="p-error">{String(errors[name]?.message)}</small>
      )}
    </div>
  );

  const pctField = (name: keyof DealerPolicySchema, label: string) => (
    <div className="field col-12 md:col-4">
      <label htmlFor={String(name)} className="font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputNumber
            id={String(name)}
            value={(field.value as number) ?? 0}
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
      {errors[name] && (
        <small className="p-error">{String(errors[name]?.message)}</small>
      )}
    </div>
  );

  const switchField = (name: keyof DealerPolicySchema, label: string) => (
    <div className="field col-12 md:col-4 flex flex-column gap-2">
      <label htmlFor={String(name)} className="font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputSwitch
            id={String(name)}
            checked={Boolean(field.value)}
            onChange={(e) => field.onChange(e.value)}
          />
        )}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="card flex justify-content-center p-6">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="card">
      <Toast ref={toast} />
      <div className="mb-3 border-bottom-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-900 m-0 flex align-items-center">
          <i className="pi pi-cog mr-3 text-primary text-3xl" />
          Configuración Comercial del Concesionario
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <h5 className="mt-2">Vigencias</h5>
        <div className="grid formgrid">
          {intField("quoteValidityDays", "Vigencia cotización (días)", undefined, 1, 365)}
          {intField("reservationValidityDays", "Vigencia reserva (días)", undefined, 1, 365)}
          {intField("alertWindowHours", "Ventana de alertas (horas)", undefined, 1, 720)}
        </div>

        <h5 className="mt-3">Anticipo mínimo para reservar</h5>
        <div className="grid formgrid">
          <div className="field col-12 md:col-4">
            <label htmlFor="minDepositAmount" className="font-medium">
              Monto mínimo
            </label>
            <Controller
              name="minDepositAmount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="minDepositAmount"
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value ?? null)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                />
              )}
            />
          </div>
          <div className="field col-12 md:col-4">
            <label htmlFor="minDepositPct" className="font-medium">
              % mínimo
            </label>
            <Controller
              name="minDepositPct"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="minDepositPct"
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value ?? null)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  max={100}
                  suffix=" %"
                />
              )}
            />
          </div>
        </div>

        <h5 className="mt-3">Topes de descuento por nivel jerárquico</h5>
        <div className="grid formgrid">
          {pctField("maxDiscountPctAdvisor", "Asesor")}
          {pctField("maxDiscountPctSupervisor", "Supervisor / Gerente Ventas")}
          {pctField("maxDiscountPctManager", "Gerente Comercial")}
        </div>

        <h5 className="mt-3">Obligatoriedades y SLA</h5>
        <div className="grid formgrid">
          {switchField("requireTestDrive", "Prueba de manejo obligatoria")}
          {switchField("requireAppraisalForTradeIn", "Avalúo obligatorio en retoma")}
          {switchField("requireDepositForReservation", "Anticipo obligatorio en reserva")}
          {intField("leadFollowUpSlaHours", "SLA seguimiento leads (horas)", undefined, 1, 2160)}
          {pctField("commissionPctDefault", "Comisión base por venta")}
        </div>

        <h5 className="mt-3">Observaciones</h5>
        <div className="grid formgrid">
          <div className="field col-12">
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

        <div className="flex justify-content-end mt-3">
          <Button
            type="submit"
            label="Guardar configuración"
            icon="pi pi-check"
            loading={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}
