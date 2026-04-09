"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { ingressMotiveService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createIngressMotiveSchema,
  updateIngressMotiveSchema,
  type CreateIngressMotiveForm,
} from "@/libs/zods/workshop/ingressMotiveZod";
import type { IngressMotive } from "@/libs/interfaces/workshop";

interface IngressMotiveFormProps {
  ingressMotive: IngressMotive | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function IngressMotiveForm({
  ingressMotive,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: IngressMotiveFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIngressMotiveForm>({
    resolver: zodResolver(ingressMotive ? updateIngressMotiveSchema : createIngressMotiveSchema),
    mode: "onBlur",
    defaultValues: { code: "", name: "", description: "" },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (ingressMotive) {
      reset({
        code: ingressMotive.code ?? "",
        name: ingressMotive.name ?? "",
        description: ingressMotive.description ?? "",
      });
    } else {
      reset({ code: "", name: "", description: "" });
    }
  }, [ingressMotive, reset, isLoading]);

  const onSubmit = async (data: CreateIngressMotiveForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
      };
      if (ingressMotive?.id) {
        await ingressMotiveService.update(ingressMotive.id, payload);
      } else {
        await ingressMotiveService.create(payload as any);
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
    <form id={formId ?? "ingress-motive-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
                placeholder="Ej: ACCIDENTE"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!ingressMotive?.id}
                title={ingressMotive?.id ? "El código no puede ser modificado" : ""}
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
                placeholder="Ej: Accidente de tráfico"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && <small className="p-error block mt-1">{errors.name.message}</small>}
        </div>

        {/* Descripción */}
        <div className="col-12">
          <label htmlFor="description" className="block text-900 font-medium mb-2">
            Descripción
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="description"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Descripción opcional del motivo de ingreso"
                className={errors.description ? "p-invalid" : ""}
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>
      </div>
    </form>
  );
}
