"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";

import {
  createInteractionSchema,
  CreateInteractionInput,
} from "@/libs/zods/crm/interactionZod";
import {
  Interaction,
  INTERACTION_TYPE_OPTIONS,
  INTERACTION_CHANNEL_OPTIONS,
} from "@/libs/interfaces/crm/interaction.interface";
import interactionService from "@/app/api/crm/interactionService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  interaction?: Interaction | null;
  formId?: string;
  defaultCustomerId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: Interaction) => void;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

const directionOptions = [
  { label: "Saliente (nosotros contactamos)", value: "OUTBOUND" },
  { label: "Entrante (nos contactaron)", value: "INBOUND" },
];

export default function InteractionForm({
  interaction,
  formId,
  defaultCustomerId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: Props) {
  const isEditing = !!interaction;
  const [customers, setCustomers] = React.useState<{ label: string; value: string }[]>([]);

  React.useEffect(() => {
    customerCrmService.getActive().then((res) => {
      const list = (res as any)?.data ?? res ?? [];
      setCustomers(list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: c.id })));
    }).catch(() => {});
  }, []);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInteractionInput>({
    resolver: zodResolver(createInteractionSchema),
    defaultValues: interaction
      ? {
          customerId: interaction.customerId,
          type: interaction.type as any,
          channel: interaction.channel as any ?? "GENERAL",
          direction: interaction.direction as any ?? "OUTBOUND",
          leadId: interaction.leadId ?? undefined,
          subject: interaction.subject ?? undefined,
          notes: interaction.notes,
          outcome: interaction.outcome ?? undefined,
          nextAction: interaction.nextAction ?? undefined,
          nextActionAt: interaction.nextActionAt ?? undefined,
        }
      : {
          customerId: defaultCustomerId || undefined,
          channel: "GENERAL",
          direction: "OUTBOUND",
        },
  });

  const onSubmit = async (data: CreateInteractionInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        leadId: data.leadId || undefined,
        subject: data.subject || undefined,
        outcome: data.outcome || undefined,
        nextAction: data.nextAction || undefined,
        nextActionAt: data.nextActionAt || undefined,
      };
      if (isEditing && interaction) {
        await interactionService.update(interaction.id, payload as any);
        await onSave();
      } else {
        const res = await interactionService.create(payload as any);
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
    <form id={formId || "interaction-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid row-gap-2">

        {/* Cliente */}
        {!defaultCustomerId && (
          <div className="col-12 field">
            <label className="font-semibold">Cliente <span className="text-red-500">*</span></label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={customers}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar cliente"
                  filter
                  className={errors.customerId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.customerId && <small className="p-error">{errors.customerId.message}</small>}
          </div>
        )}

        {/* Tipo + Dirección */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo <span className="text-red-500">*</span></label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={INTERACTION_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo de interacción"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && <small className="p-error">{errors.type.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Dirección</label>
          <Controller
            name="direction"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={directionOptions}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        {/* Canal */}
        <div className="col-12 md:col-6 field">
          <label>Canal</label>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={INTERACTION_CHANNEL_OPTIONS}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        {/* Asunto */}
        <div className="col-12 md:col-6 field">
          <label>Asunto</label>
          <InputText {...register("subject")} placeholder="Resumen breve" />
        </div>

        {/* Notas */}
        <div className="col-12 field">
          <label className="font-semibold">Notas <span className="text-red-500">*</span></label>
          <InputTextarea
            {...register("notes")}
            rows={4}
            placeholder="Detalle de la interacción..."
            className={errors.notes ? "p-invalid" : ""}
          />
          {errors.notes && <small className="p-error">{errors.notes.message}</small>}
        </div>

        <div className="col-12"><Divider className="my-1" /></div>

        {/* Resultado */}
        <div className="col-12 field">
          <label>Resultado / Conclusión</label>
          <InputText {...register("outcome")} placeholder="¿Cuál fue el resultado?" />
        </div>

        {/* Próxima acción */}
        <div className="col-12 md:col-8 field">
          <label>Próxima Acción</label>
          <InputText {...register("nextAction")} placeholder="¿Qué sigue?" />
        </div>

        <div className="col-12 md:col-4 field">
          <label>Fecha Próxima Acción</label>
          <Controller
            name="nextActionAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(e.value ? (e.value as Date).toISOString() : "")
                }
                dateFormat="dd/mm/yy"
                showIcon
              />
            )}
          />
        </div>

      </div>
    </form>
  );
}
