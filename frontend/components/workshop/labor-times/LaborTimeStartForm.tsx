"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import TechnicianSelector from "@/components/common/TechnicianSelector";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { laborTimeService, workshopOperationService } from "@/app/api/workshop";
import type { WorkshopOperation } from "@/libs/interfaces/workshop";

const startSchema = z.object({
  serviceOrderId: z
    .string({ required_error: "La OT es requerida" })
    .min(1, "La OT es requerida"),
  technicianId: z
    .string({ required_error: "El técnico es requerido" })
    .min(1, "El técnico es requerido"),
  operationId: z.string().nullable().optional(),
  serviceOrderItemId: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type StartForm = z.infer<typeof startSchema>;

interface LaborTimeStartFormProps {
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function LaborTimeStartForm({
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: LaborTimeStartFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [operations, setOperations] = useState<WorkshopOperation[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StartForm>({
    resolver: zodResolver(startSchema),
    mode: "onBlur",
    defaultValues: {
      serviceOrderId: "",
      technicianId: "",
      operationId: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await workshopOperationService.getAll({
          isActive: "true",
          limit: 200,
        });
        setOperations(res.data ?? []);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const onSubmit = async (data: StartForm) => {
    onSubmittingChange?.(true);
    try {
      await laborTimeService.start({
        serviceOrderId: data.serviceOrderId,
        technicianId: data.technicianId,
        operationId: data.operationId ?? undefined,
        serviceOrderItemId: data.serviceOrderItemId ?? undefined,
        notes: data.notes ?? undefined,
      });
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
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form
      id={formId ?? "labor-time-start-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        <div className="col-12">
          <label className="block text-900 font-medium mb-2">
            Orden de Trabajo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="serviceOrderId"
            control={control}
            render={({ field }) => (
              <ServiceOrderSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.serviceOrderId}
              />
            )}
          />
          {errors.serviceOrderId && (
            <small className="p-error block mt-1">
              {errors.serviceOrderId.message}
            </small>
          )}
        </div>

        <div className="col-12">
          <label
            htmlFor="technicianId"
            className="block text-900 font-medium mb-2"
          >
            Técnico <span className="text-red-500">*</span>
          </label>
          <Controller
            name="technicianId"
            control={control}
            render={({ field }) => (
              <TechnicianSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.technicianId}
              />
            )}
          />
          {errors.technicianId && (
            <small className="p-error block mt-1">
              {errors.technicianId.message}
            </small>
          )}
        </div>

        <div className="col-12">
          <label
            htmlFor="operationId"
            className="block text-900 font-medium mb-2"
          >
            Operación
          </label>
          <Controller
            name="operationId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="operationId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={operations}
                optionLabel="name"
                optionValue="id"
                placeholder="Sin operación asignada"
                showClear
                filter
              />
            )}
          />
        </div>

        <div className="col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Notas
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                {...field}
                value={field.value ?? ""}
                rows={2}
                placeholder="Notas opcionales..."
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
