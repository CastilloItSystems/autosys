"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";

import {
  createLeadSchema,
  CreateLeadInput,
} from "@/libs/zods/crm/leadZod";
import {
  Lead,
  LEAD_CHANNEL_OPTIONS,
  LEAD_SOURCE_OPTIONS,
} from "@/libs/interfaces/crm/lead.interface";
import leadService from "@/app/api/crm/leadService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  lead?: Lead | null;
  formId?: string;
  defaultCustomerId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (lead: Lead) => void;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "VES", value: "VES" },
  { label: "EUR", value: "EUR" },
];

export default function LeadForm({
  lead,
  formId,
  defaultCustomerId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: Props) {
  const isEditing = !!lead;

  const [customers, setCustomers] = React.useState<{ label: string; value: string }[]>([]);

  React.useEffect(() => {
    customerCrmService.getActive().then((res) => {
      const list = (res as any)?.data ?? res ?? [];
      setCustomers(
        list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: c.id }))
      );
    }).catch(() => {});
  }, []);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: lead
      ? {
          title: lead.title,
          channel: lead.channel as any,
          source: lead.source as any,
          customerId: lead.customerId ?? undefined,
          description: lead.description ?? undefined,
          estimatedValue: lead.estimatedValue ?? undefined,
          currency: lead.currency ?? "USD",
          assignedTo: lead.assignedTo ?? undefined,
          expectedCloseAt: lead.expectedCloseAt ?? undefined,
        }
      : {
          currency: "USD",
          customerId: defaultCustomerId || undefined,
        },
  });

  const onSubmit = async (data: CreateLeadInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        customerId: data.customerId || undefined,
        description: data.description || undefined,
        assignedTo: data.assignedTo || undefined,
        expectedCloseAt: data.expectedCloseAt || undefined,
      };
      if (isEditing && lead) {
        await leadService.update(lead.id, payload as any);
        await onSave();
      } else {
        const res = await leadService.create(payload as any);
        await onSave();
        if (onCreated) onCreated((res as any)?.data ?? res);
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId || "lead-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid row-gap-2">

        {/* Título */}
        <div className="col-12 field">
          <label className="font-semibold">Título <span className="text-red-500">*</span></label>
          <InputText
            {...register("title")}
            placeholder="Ej: Compra de repuestos para Toyota Corolla"
            className={errors.title ? "p-invalid" : ""}
          />
          {errors.title && <small className="p-error">{errors.title.message}</small>}
        </div>

        {/* Canal + Fuente */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Canal <span className="text-red-500">*</span></label>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={LEAD_CHANNEL_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar canal"
                className={errors.channel ? "p-invalid" : ""}
              />
            )}
          />
          {errors.channel && <small className="p-error">{errors.channel.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Fuente <span className="text-red-500">*</span></label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={LEAD_SOURCE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="¿Cómo llegó?"
                className={errors.source ? "p-invalid" : ""}
              />
            )}
          />
          {errors.source && <small className="p-error">{errors.source.message}</small>}
        </div>

        <div className="col-12"><Divider className="my-1" /></div>

        {/* Cliente */}
        <div className="col-12 field">
          <label>Cliente</label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                options={customers}
                optionLabel="label"
                optionValue="value"
                placeholder="Vincular a un cliente existente"
                showClear
                filter
              />
            )}
          />
        </div>

        {/* Valor estimado */}
        <div className="col-12 md:col-8 field">
          <label>Valor Estimado</label>
          <Controller
            name="estimatedValue"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                mode="decimal"
                minFractionDigits={2}
                placeholder="0.00"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={currencyOptions}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        {/* Cierre esperado */}
        <div className="col-12 md:col-6 field">
          <label>Cierre Esperado</label>
          <Controller
            name="expectedCloseAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(e.value ? (e.value as Date).toISOString() : "")
                }
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="Fecha de cierre"
              />
            )}
          />
        </div>

        {/* Descripción */}
        <div className="col-12 field">
          <label>Descripción</label>
          <InputTextarea
            {...register("description")}
            rows={3}
            placeholder="Detalles del lead u oportunidad"
          />
        </div>

      </div>
    </form>
  );
}
