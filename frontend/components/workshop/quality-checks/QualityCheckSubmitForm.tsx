"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { qualityCheckService } from "@/app/api/workshop";
import type { QualityCheck } from "@/libs/interfaces/workshop";

const checklistItemSchema = z.object({
  key: z.string(),
  label: z.string().min(1, "La etiqueta es requerida"),
  passed: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

const schema = z.object({
  checklistItems: z.array(checklistItemSchema).min(1, "Agrega al menos un ítem"),
  failureNotes: z.string().max(1000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  qualityCheck: QualityCheck | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

const DEFAULT_CHECKLIST = [
  { key: "visual", label: "Inspección visual exterior", passed: false, notes: "" },
  { key: "fluids", label: "Niveles de fluidos correctos", passed: false, notes: "" },
  { key: "lights", label: "Luces funcionando", passed: false, notes: "" },
  { key: "tires", label: "Presión de neumáticos", passed: false, notes: "" },
  { key: "brakes", label: "Frenos operativos", passed: false, notes: "" },
  { key: "work_done", label: "Trabajo solicitado completado", passed: false, notes: "" },
  { key: "clean", label: "Vehículo limpio al entregar", passed: false, notes: "" },
];

export default function QualityCheckSubmitForm({ qualityCheck, onSave, formId, onSubmittingChange, toast }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { checklistItems: DEFAULT_CHECKLIST, failureNotes: "", notes: "" },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "checklistItems" });
  const checklistItems = watch("checklistItems");
  const allPassed = checklistItems?.every((i) => i.passed);
  const anyFailed = checklistItems?.some((i) => !i.passed);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading || !qualityCheck) return;
    const items = qualityCheck.checklistItems?.length
      ? qualityCheck.checklistItems.map((i) => ({
          key: i.key,
          label: i.label,
          passed: i.passed,
          notes: i.notes ?? "",
        }))
      : DEFAULT_CHECKLIST;
    reset({ checklistItems: items, failureNotes: qualityCheck.failureNotes ?? "", notes: qualityCheck.notes ?? "" });
  }, [qualityCheck, reset, isLoading]);

  const onSubmit = async (data: FormData) => {
    if (!qualityCheck?.id) return;
    onSubmittingChange?.(true);
    try {
      await qualityCheckService.submit(qualityCheck.id, {
        checklistItems: data.checklistItems.map((i) => ({
          key: i.key,
          label: i.label,
          passed: i.passed,
          notes: i.notes ?? undefined,
        })),
        failureNotes: data.failureNotes ?? undefined,
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
        <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="mt-3 text-600 font-medium">Cargando checklist...</p>
      </div>
    );
  }

  return (
    <form id={formId ?? "quality-check-submit-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">

        {/* Resumen */}
        {qualityCheck && (
          <div className="col-12">
            <div className="p-3 surface-100 border-round flex gap-4 text-sm">
              <span><b>OT:</b> {qualityCheck.serviceOrder?.folio ?? qualityCheck.serviceOrderId.slice(0, 8)}</span>
              <span><b>Inspector:</b> {qualityCheck.inspectorId.slice(0, 8)}</span>
              {qualityCheck.retryCount > 0 && (
                <span className="text-orange-600"><b>Reintento #{qualityCheck.retryCount}</b></span>
              )}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="col-12">
          <Divider align="left" className="mt-0">
            <span className="text-700 font-semibold text-sm">Checklist de inspección</span>
          </Divider>
        </div>

        <div className="col-12">
          <div className="flex flex-column gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 surface-50 border-1 border-round border-200 grid m-0 gap-2 align-items-center">
                <div className="col-fixed p-0" style={{ width: "2rem" }}>
                  <Controller
                    name={`checklistItems.${index}.passed`}
                    control={control}
                    render={({ field: f }) => (
                      <Checkbox
                        inputId={`item-${index}`}
                        checked={f.value ?? false}
                        onChange={(e) => f.onChange(e.checked ?? false)}
                      />
                    )}
                  />
                </div>
                <div className="col p-0">
                  <Controller
                    name={`checklistItems.${index}.label`}
                    control={control}
                    render={({ field: f }) => (
                      <InputText
                        {...f}
                        className="w-full"
                        placeholder="Ítem de inspección"
                      />
                    )}
                  />
                </div>
                <div className="col p-0">
                  <Controller
                    name={`checklistItems.${index}.notes`}
                    control={control}
                    render={({ field: f }) => (
                      <InputText
                        {...f}
                        value={f.value ?? ""}
                        placeholder="Notas (opcional)"
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div className="col-fixed p-0" style={{ width: "2.5rem" }}>
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    type="button"
                    onClick={() => remove(index)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              label="Agregar ítem"
              icon="pi pi-plus"
              outlined
              size="small"
              className="w-auto align-self-start mt-1"
              onClick={() => append({ key: `item_${Date.now()}`, label: "", passed: false, notes: "" })}
            />
          </div>
          {errors.checklistItems && (
            <small className="p-error block mt-1">
              {typeof errors.checklistItems.message === "string" ? errors.checklistItems.message : "Error en checklist"}
            </small>
          )}
        </div>

        {/* Estado resultante */}
        {checklistItems?.length > 0 && (
          <div className="col-12">
            <div className={`p-3 border-round flex align-items-center gap-2 ${allPassed ? "bg-green-50 border-1 border-green-300" : "bg-orange-50 border-1 border-orange-300"}`}>
              <i className={`pi ${allPassed ? "pi-check-circle text-green-600" : "pi-times-circle text-orange-600"} text-xl`} />
              <span className={`font-semibold ${allPassed ? "text-green-700" : "text-orange-700"}`}>
                {allPassed
                  ? "Todos los ítems aprobados — la OT pasará a LISTA"
                  : `${checklistItems.filter((i) => !i.passed).length} ítem(s) fallido(s) — la OT volverá a EN PROCESO`}
              </span>
            </div>
          </div>
        )}

        {anyFailed && (
          <div className="col-12">
            <label htmlFor="failureNotes" className="block text-900 font-medium mb-2">
              Notas de falla
            </label>
            <Controller
              name="failureNotes"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="failureNotes"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Describe los problemas encontrados..."
                />
              )}
            />
          </div>
        )}

        <div className="col-12">
          <label htmlFor="qcNotes" className="block text-900 font-medium mb-2">
            Notas generales
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="qcNotes"
                {...field}
                value={field.value ?? ""}
                rows={2}
                placeholder="Observaciones generales..."
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
