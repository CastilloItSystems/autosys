"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";

import {
  createActivitySchema,
  CreateActivityInput,
} from "@/libs/zods/crm/activityZod";
import {
  Activity,
  ACTIVITY_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/activity.interface";
import activityService from "@/app/api/crm/activityService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import { handleFormError } from "@/utils/errorHandlers";
import UserSelector from "@/components/common/UserSelector";

interface Props {
  activity?: Activity | null;
  formId?: string;
  defaultCustomerId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: Activity) => void;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function ActivityForm({
  activity,
  formId,
  defaultCustomerId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: Props) {
  const isEditing = !!activity;
  const [customers, setCustomers] = React.useState<
    { label: string; value: string }[]
  >([]);

  React.useEffect(() => {
    customerCrmService
      .getActive()
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setCustomers(
          list.map((c: any) => ({
            label: `${c.name} (${c.code})`,
            value: c.id,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: activity
      ? {
          customerId: activity.customerId,
          type: activity.type as any,
          title: activity.title,
          assignedTo: activity.assignedTo,
          dueAt: activity.dueAt,
          leadId: activity.leadId ?? undefined,
          description: activity.description ?? undefined,
        }
      : {
          customerId: defaultCustomerId || undefined,
        },
  });

  const onSubmit = async (data: CreateActivityInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        leadId: data.leadId || undefined,
        description: data.description || undefined,
      };
      if (isEditing && activity) {
        await activityService.update(activity.id, payload as any);
        await onSave();
      } else {
        const res = await activityService.create(payload as any);
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
    <form
      id={formId || "activity-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid row-gap-2">
        {/* Cliente */}
        {!defaultCustomerId && (
          <div className="col-12 field">
            <label className="font-semibold">
              Cliente <span className="text-red-500">*</span>
            </label>
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
            {errors.customerId && (
              <small className="p-error">{errors.customerId.message}</small>
            )}
          </div>
        )}

        {/* Título */}
        <div className="col-12 field">
          <label className="font-semibold">
            Título <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("title")}
            placeholder="Ej: Llamar para seguimiento"
            className={errors.title ? "p-invalid" : ""}
          />
          {errors.title && (
            <small className="p-error">{errors.title.message}</small>
          )}
        </div>

        {/* Tipo + Vencimiento */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Tipo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={ACTIVITY_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo de actividad"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Fecha Límite <span className="text-red-500">*</span>
          </label>
          <Controller
            name="dueAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(e.value ? (e.value as Date).toISOString() : "")
                }
                dateFormat="dd/mm/yy"
                showTime
                showIcon
                placeholder="Fecha y hora límite"
                className={errors.dueAt ? "p-invalid" : ""}
              />
            )}
          />
          {errors.dueAt && (
            <small className="p-error">{errors.dueAt.message}</small>
          )}
        </div>

        {/* Asignado a */}
        <div className="col-12 field">
          <label className="font-semibold">
            Asignado a <span className="text-red-500">*</span>
          </label>
          <Controller
            name="assignedTo"
            control={control}
            render={({ field }) => (
              <UserSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.assignedTo}
              />
            )}
          />
          {errors.assignedTo && (
            <small className="p-error">{errors.assignedTo.message}</small>
          )}
        </div>

        {/* Descripción */}
        <div className="col-12 field">
          <label>Descripción</label>
          <InputTextarea
            {...register("description")}
            rows={3}
            placeholder="Detalles adicionales de la actividad"
          />
        </div>
      </div>
    </form>
  );
}
