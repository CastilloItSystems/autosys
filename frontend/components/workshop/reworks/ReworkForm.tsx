"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { reworkService } from "@/app/api/workshop";
import TechnicianSelector from "@/components/common/TechnicianSelector";
import {
  createReworkSchema,
  updateReworkSchema,
} from "@/libs/zods/workshop/reworkZod";
import type {
  CreateReworkForm,
  UpdateReworkForm,
} from "@/libs/zods/workshop/reworkZod";
import type { WorkshopRework } from "@/libs/interfaces/workshop";

interface Props {
  rework: WorkshopRework | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function ReworkForm({
  rework,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const isUpdate = !!rework?.id;
  const [isLoading, setIsLoading] = useState(true);

  // ── Create form ──────────────────────────────────────────────────────────
  const createForm = useForm<CreateReworkForm>({
    resolver: zodResolver(createReworkSchema),
    mode: "onBlur",
    defaultValues: {
      originalOrderId: "",
      motive: "",
      rootCause: "",
      technicianId: "",
      estimatedCost: undefined,
      notes: "",
    },
  });

  // ── Update form ──────────────────────────────────────────────────────────
  const updateForm = useForm<UpdateReworkForm>({
    resolver: zodResolver(updateReworkSchema),
    mode: "onBlur",
    defaultValues: {
      rootCause: "",
      technicianId: "",
      estimatedCost: undefined,
      realCost: undefined,
      notes: "",
      reworkOrderId: "",
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isUpdate && rework) {
      updateForm.reset({
        rootCause: rework.rootCause ?? "",
        technicianId: rework.technicianId ?? "",
        estimatedCost: rework.estimatedCost ?? undefined,
        realCost: rework.realCost ?? undefined,
        notes: rework.notes ?? "",
        reworkOrderId: rework.reworkOrderId ?? "",
      });
    }
  }, [rework, isUpdate, isLoading, updateForm]);

  const onCreateSubmit = async (data: CreateReworkForm) => {
    onSubmittingChange?.(true);
    try {
      await reworkService.create({
        originalOrderId: data.originalOrderId,
        motive: data.motive,
        rootCause: data.rootCause || undefined,
        technicianId: data.technicianId || undefined,
        estimatedCost: data.estimatedCost ?? undefined,
        notes: data.notes || undefined,
      });
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const onUpdateSubmit = async (data: UpdateReworkForm) => {
    if (!rework?.id) return;
    onSubmittingChange?.(true);
    try {
      await reworkService.update(rework.id, {
        rootCause: data.rootCause || undefined,
        technicianId: data.technicianId || undefined,
        estimatedCost: data.estimatedCost ?? undefined,
        realCost: data.realCost ?? undefined,
        notes: data.notes || undefined,
        reworkOrderId: data.reworkOrderId || undefined,
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
        <p className="mt-3 text-600 font-medium">Cargando formulario...</p>
      </div>
    );
  }

  // ── UPDATE form ────────────────────────────────────────────────────────
  if (isUpdate) {
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = updateForm;
    return (
      <form
        id={formId ?? "rework-form"}
        onSubmit={handleSubmit(onUpdateSubmit)}
        className="p-fluid"
      >
        <div className="grid">
          {/* Info bar */}
          <div className="col-12">
            <div className="p-3 surface-100 border-round flex gap-4 text-sm mb-1 flex-wrap">
              <span>
                <b>OT original:</b>{" "}
                {rework.originalOrder?.folio ??
                  rework.originalOrderId.slice(0, 8) + "..."}
              </span>
              <span>
                <b>Estado:</b> {rework.status}
              </span>
              <span>
                <b>Creado por:</b> {rework.createdBy}
              </span>
            </div>
          </div>

          {/* Causa raíz */}
          <div className="col-12">
            <label
              htmlFor="rootCause"
              className="block text-900 font-medium mb-2"
            >
              Causa raíz
            </label>
            <Controller
              name="rootCause"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="rootCause"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Causa identificada del problema..."
                />
              )}
            />
            {errors.rootCause && (
              <small className="p-error block mt-1">
                {errors.rootCause.message}
              </small>
            )}
          </div>

          {/* Técnico */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Técnico responsable
            </label>
            <Controller
              name="technicianId"
              control={control}
              render={({ field }) => (
                <TechnicianSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* OT Retrabajo */}
          <div className="col-12 md:col-6">
            <label
              htmlFor="reworkOrderId"
              className="block text-900 font-medium mb-2"
            >
              ID OT de retrabajo generada
            </label>
            <Controller
              name="reworkOrderId"
              control={control}
              render={({ field }) => (
                <InputText
                  id="reworkOrderId"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="ID de la nueva OT creada para el retrabajo"
                />
              )}
            />
          </div>

          {/* Costo estimado */}
          <div className="col-12 md:col-6">
            <label
              htmlFor="estimatedCost"
              className="block text-900 font-medium mb-2"
            >
              Costo estimado (MXN)
            </label>
            <Controller
              name="estimatedCost"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="estimatedCost"
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="MXN"
                  locale="es-MX"
                  minFractionDigits={2}
                  placeholder="$0.00"
                />
              )}
            />
            {errors.estimatedCost && (
              <small className="p-error block mt-1">
                {errors.estimatedCost.message}
              </small>
            )}
          </div>

          {/* Costo real */}
          <div className="col-12 md:col-6">
            <label
              htmlFor="realCost"
              className="block text-900 font-medium mb-2"
            >
              Costo real (MXN)
            </label>
            <Controller
              name="realCost"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="realCost"
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="MXN"
                  locale="es-MX"
                  minFractionDigits={2}
                  placeholder="$0.00 (opcional)"
                />
              )}
            />
            {errors.realCost && (
              <small className="p-error block mt-1">
                {errors.realCost.message}
              </small>
            )}
          </div>

          {/* Notas */}
          <div className="col-12">
            <label htmlFor="notes" className="block text-900 font-medium mb-2">
              Notas adicionales
            </label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="notes"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Observaciones internas, instrucciones especiales..."
                />
              )}
            />
            {errors.notes && (
              <small className="p-error block mt-1">
                {errors.notes.message}
              </small>
            )}
          </div>
        </div>
      </form>
    );
  }

  // ── CREATE form ────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = createForm;
  return (
    <form
      id={formId ?? "rework-form"}
      onSubmit={handleSubmit(onCreateSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* OT Original */}
        <div className="col-12">
          <label
            htmlFor="originalOrderId"
            className="block text-900 font-medium mb-2"
          >
            ID Orden de Trabajo original <span className="text-red-500">*</span>
          </label>
          <Controller
            name="originalOrderId"
            control={control}
            render={({ field }) => (
              <InputText
                id="originalOrderId"
                {...field}
                placeholder="ID de la OT que generó el retrabajo"
                className={errors.originalOrderId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.originalOrderId && (
            <small className="p-error block mt-1">
              {errors.originalOrderId.message}
            </small>
          )}
        </div>

        {/* Motivo / Descripción */}
        <div className="col-12">
          <label htmlFor="motive" className="block text-900 font-medium mb-2">
            Descripción / Motivo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="motive"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="motive"
                {...field}
                rows={3}
                placeholder="Describa el problema detectado que requiere retrabajo..."
                className={errors.motive ? "p-invalid" : ""}
              />
            )}
          />
          {errors.motive && (
            <small className="p-error block mt-1">
              {errors.motive.message}
            </small>
          )}
        </div>

        {/* Causa raíz */}
        <div className="col-12">
          <label
            htmlFor="rootCause"
            className="block text-900 font-medium mb-2"
          >
            Causa raíz (preliminar)
          </label>
          <Controller
            name="rootCause"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="rootCause"
                {...field}
                value={field.value ?? ""}
                rows={2}
                placeholder="Causa identificada del problema (opcional)..."
              />
            )}
          />
          {errors.rootCause && (
            <small className="p-error block mt-1">
              {errors.rootCause.message}
            </small>
          )}
        </div>

        {/* Técnico */}
        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Técnico responsable
          </label>
          <Controller
            name="technicianId"
            control={control}
            render={({ field }) => (
              <TechnicianSelector
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Costo estimado */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="estimatedCost"
            className="block text-900 font-medium mb-2"
          >
            Costo estimado (MXN)
          </label>
          <Controller
            name="estimatedCost"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="estimatedCost"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                placeholder="$0.00"
              />
            )}
          />
          {errors.estimatedCost && (
            <small className="p-error block mt-1">
              {errors.estimatedCost.message}
            </small>
          )}
        </div>

        {/* Notas */}
        <div className="col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Notas adicionales
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
                placeholder="Observaciones internas, instrucciones especiales..."
              />
            )}
          />
          {errors.notes && (
            <small className="p-error block mt-1">{errors.notes.message}</small>
          )}
        </div>
      </div>
    </form>
  );
}
