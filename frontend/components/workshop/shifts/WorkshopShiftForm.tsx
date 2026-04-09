"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { workshopShiftService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createWorkshopShiftSchema,
  updateWorkshopShiftSchema,
  type CreateWorkshopShiftForm,
} from "@/libs/zods/workshop/workshopShiftZod";
import type { WorkshopShift } from "@/libs/interfaces/workshop";

const DAY_OPTIONS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

interface WorkshopShiftFormProps {
  shift: WorkshopShift | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function WorkshopShiftForm({
  shift,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: WorkshopShiftFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkshopShiftForm>({
    resolver: zodResolver(shift ? updateWorkshopShiftSchema : createWorkshopShiftSchema),
    mode: "onBlur",
    defaultValues: { code: "", name: "", startTime: "", endTime: "", workDays: [] },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (shift) {
      reset({
        code: shift.code ?? "",
        name: shift.name ?? "",
        startTime: shift.startTime ?? "",
        endTime: shift.endTime ?? "",
        workDays: shift.workDays ?? [],
      });
    } else {
      reset({ code: "", name: "", startTime: "", endTime: "", workDays: [] });
    }
  }, [shift, reset, isLoading]);

  const onSubmit = async (data: CreateWorkshopShiftForm) => {
    onSubmittingChange?.(true);
    try {
      if (shift?.id) {
        await workshopShiftService.update(shift.id, data);
      } else {
        await workshopShiftService.create(data as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form id={formId ?? "workshop-shift-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Código */}
        <div className="col-12 md:col-6">
          <label htmlFor="code" className="block text-900 font-medium mb-2">
            Código <span className="text-red-500">*</span>
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                id="code"
                {...field}
                placeholder="Ej: TURNO-MAT"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!shift?.id}
                title={shift?.id ? "El código no puede ser modificado" : ""}
              />
            )}
          />
          {errors.code && <small className="p-error block mt-1">{errors.code.message}</small>}
        </div>

        {/* Nombre */}
        <div className="col-12 md:col-6">
          <label htmlFor="name" className="block text-900 font-medium mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="name"
                {...field}
                placeholder="Ej: Turno Matutino"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && <small className="p-error block mt-1">{errors.name.message}</small>}
        </div>

        {/* Hora de inicio */}
        <div className="col-12 md:col-6">
          <label htmlFor="startTime" className="block text-900 font-medium mb-2">
            Hora de inicio <span className="text-red-500">*</span>
          </label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <InputMask
                id="startTime"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
                mask="99:99"
                placeholder="08:00"
                className={errors.startTime ? "p-invalid" : ""}
              />
            )}
          />
          {errors.startTime && <small className="p-error block mt-1">{errors.startTime.message}</small>}
        </div>

        {/* Hora de fin */}
        <div className="col-12 md:col-6">
          <label htmlFor="endTime" className="block text-900 font-medium mb-2">
            Hora de fin <span className="text-red-500">*</span>
          </label>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <InputMask
                id="endTime"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
                mask="99:99"
                placeholder="17:00"
                className={errors.endTime ? "p-invalid" : ""}
              />
            )}
          />
          {errors.endTime && <small className="p-error block mt-1">{errors.endTime.message}</small>}
        </div>

        {/* Días de trabajo */}
        <div className="col-12">
          <label htmlFor="workDays" className="block text-900 font-medium mb-2">
            Días de trabajo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="workDays"
            control={control}
            render={({ field }) => (
              <MultiSelect
                id="workDays"
                value={field.value ?? []}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
                options={DAY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione los días de trabajo"
                display="chip"
                className={errors.workDays ? "p-invalid" : ""}
              />
            )}
          />
          {errors.workDays && <small className="p-error block mt-1">{(errors.workDays as any).message}</small>}
        </div>
      </div>
    </form>
  );
}
