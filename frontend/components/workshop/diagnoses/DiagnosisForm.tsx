"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { WorkshopFormSection } from "@/components/workshop/shared";
import { diagnosisService } from "@/app/api/workshop";
import ReceptionSelector from "@/components/common/ReceptionSelector";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import TechnicianSelector from "@/components/common/TechnicianSelector";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createDiagnosisSchema,
  updateDiagnosisSchema,
  type CreateDiagnosisForm,
} from "@/libs/zods/workshop/diagnosisZod";
import type { Diagnosis } from "@/libs/interfaces/workshop";

const SEVERITY_OPTIONS = [
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" },
];

interface DiagnosisFormProps {
  diagnosis: Diagnosis | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function DiagnosisForm({
  diagnosis,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DiagnosisFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDiagnosisForm>({
    resolver: zodResolver(
      diagnosis ? updateDiagnosisSchema : createDiagnosisSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      receptionId: "",
      serviceOrderId: "",
      technicianId: "",
      generalNotes: "",
      severity: undefined,
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (diagnosis) {
      reset({
        receptionId: diagnosis.receptionId ?? "",
        serviceOrderId: diagnosis.serviceOrderId ?? "",
        technicianId: diagnosis.technicianId ?? "",
        generalNotes: diagnosis.generalNotes ?? "",
        severity: (diagnosis.severity as any) ?? undefined,
      });
    } else {
      reset({
        receptionId: "",
        serviceOrderId: "",
        technicianId: "",
        generalNotes: "",
        severity: undefined,
      });
    }
  }, [diagnosis, reset, isLoading]);

  const onSubmit = async (data: CreateDiagnosisForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        receptionId: data.receptionId || undefined,
        serviceOrderId: data.serviceOrderId || undefined,
        technicianId: data.technicianId || undefined,
        generalNotes: data.generalNotes || undefined,
        severity: data.severity || undefined,
      };
      if (diagnosis?.id) {
        await diagnosisService.update(diagnosis.id, payload);
      } else {
        await diagnosisService.create(payload);
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
      id={formId ?? "diagnosis-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <WorkshopFormSection title="Información General" icon="pi-info-circle">
        <div className="grid">
          {/* Recepción */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Recepción</label>
            <Controller
              name="receptionId"
              control={control}
              render={({ field }) => (
                <ReceptionSelector
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.receptionId}
                />
              )}
            />
            {errors.receptionId && (
              <small className="p-error block mt-1">
                {errors.receptionId.message}
              </small>
            )}
          </div>

          {/* Orden de Servicio */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Orden de Servicio
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

          {/* Técnico */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Técnico</label>
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

          {/* Severidad */}
          <div className="col-12 md:col-6">
            <label
              htmlFor="severity"
              className="block text-900 font-medium mb-2"
            >
              Severidad
            </label>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="severity"
                  value={field.value ?? null}
                  options={SEVERITY_OPTIONS}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  placeholder="Selecciona severidad"
                  showClear
                  className={errors.severity ? "p-invalid" : ""}
                />
              )}
            />
            {errors.severity && (
              <small className="p-error block mt-1">
                {errors.severity.message}
              </small>
            )}
          </div>

          {/* Notas generales */}
          <div className="col-12">
            <label
              htmlFor="generalNotes"
              className="block text-900 font-medium mb-2"
            >
              Notas Generales
            </label>
            <Controller
              name="generalNotes"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="generalNotes"
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  placeholder="Observaciones generales del diagnóstico..."
                  className={errors.generalNotes ? "p-invalid" : ""}
                />
              )}
            />
            {errors.generalNotes && (
              <small className="p-error block mt-1">
                {errors.generalNotes.message}
              </small>
            )}
          </div>
        </div>
      </WorkshopFormSection>
    </form>
  );
}
