"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { checklistService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  type CreateChecklistTemplateForm,
} from "@/libs/zods/workshop/checklistZod";
import type { ChecklistTemplate } from "@/libs/interfaces/workshop";

const CATEGORY_OPTIONS = [
  { label: "Recepción", value: "RECEPTION" },
  { label: "Diagnóstico", value: "DIAGNOSIS" },
  { label: "Control de calidad", value: "QUALITY_CONTROL" },
];

const RESPONSE_TYPE_OPTIONS = [
  { label: "Sí/No", value: "BOOLEAN" },
  { label: "Texto", value: "TEXT" },
  { label: "Número", value: "NUMBER" },
  { label: "Selección", value: "SELECTION" },
];

interface ChecklistTemplateFormProps {
  template: ChecklistTemplate | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function ChecklistTemplateForm({
  template,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: ChecklistTemplateFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateChecklistTemplateForm>({
    resolver: zodResolver(template ? updateChecklistTemplateSchema : createChecklistTemplateSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "RECEPTION",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (template) {
      reset({
        code: template.code ?? "",
        name: template.name ?? "",
        description: template.description ?? "",
        category: template.category ?? "RECEPTION",
        items: (template.items ?? []).map((item) => ({
          id: item.id,
          code: item.code ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          responseType: item.responseType ?? "BOOLEAN",
          isRequired: item.isRequired ?? false,
          order: item.order ?? 0,
          options: item.options ?? null,
        })),
      });
    } else {
      reset({ code: "", name: "", description: "", category: "RECEPTION", items: [] });
    }
  }, [template, reset, isLoading]);

  const onSubmit = async (data: CreateChecklistTemplateForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        description: data.description || null,
        items: (data.items ?? []).map((item, idx) => ({
          ...item,
          description: item.description || null,
          order: item.order ?? idx,
          options: item.options && item.options.length > 0 ? item.options : null,
        })),
      };
      if (template?.id) {
        await checklistService.update(template.id, payload as any);
      } else {
        await checklistService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const addItem = () => {
    append({
      code: "",
      name: "",
      responseType: "BOOLEAN",
      isRequired: false,
      order: fields.length,
      options: null,
      description: "",
    });
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
    <form id={formId ?? "checklist-template-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Código */}
        <div className="col-12 md:col-4">
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
                placeholder="Ej: CHK-RECEPCION"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!template?.id}
                title={template?.id ? "El código no puede ser modificado" : ""}
              />
            )}
          />
          {errors.code && <small className="p-error block mt-1">{errors.code.message}</small>}
        </div>

        {/* Nombre */}
        <div className="col-12 md:col-5">
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
                placeholder="Ej: Checklist de Recepción"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && <small className="p-error block mt-1">{errors.name.message}</small>}
        </div>

        {/* Categoría */}
        <div className="col-12 md:col-3">
          <label htmlFor="category" className="block text-900 font-medium mb-2">
            Categoría <span className="text-red-500">*</span>
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="category"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
                options={CATEGORY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar categoría"
                className={errors.category ? "p-invalid" : ""}
              />
            )}
          />
          {errors.category && <small className="p-error block mt-1">{errors.category.message}</small>}
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
                rows={2}
                placeholder="Descripción opcional de la plantilla"
                className={errors.description ? "p-invalid" : ""}
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>
      </div>

      <Divider />

      {/* Sección de ítems */}
      <div className="flex align-items-center justify-content-between mb-3">
        <h5 className="m-0 text-900 font-semibold">
          <i className="pi pi-list mr-2 text-primary" />
          Ítems del checklist
          <span className="ml-2 text-600 font-normal text-sm">({fields.length} ítems)</span>
        </h5>
        <Button
          type="button"
          label="Agregar ítem"
          icon="pi pi-plus"
          size="small"
          onClick={addItem}
        />
      </div>

      {fields.length === 0 && (
        <div className="text-center p-4 surface-100 border-round text-600 mb-3">
          <i className="pi pi-inbox text-3xl mb-2 block" />
          <p className="m-0">No hay ítems. Haga clic en "Agregar ítem" para comenzar.</p>
        </div>
      )}

      {fields.map((field, index) => {
        const responseType = watch(`items.${index}.responseType`);
        const itemErrors = errors.items?.[index];

        return (
          <div key={field.id} className="border-1 surface-border border-round p-3 mb-2">
            {/* Fila 1: código, nombre, tipo de respuesta */}
            <div className="grid mb-2">
              <div className="col-12 md:col-3">
                <label className="block text-800 font-medium mb-1 text-sm">
                  Código <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`items.${index}.code`}
                  control={control}
                  render={({ field: f }) => (
                    <InputText
                      {...f}
                      placeholder="Ej: ITEM-01"
                      className={`p-inputtext-sm ${itemErrors?.code ? "p-invalid" : ""}`}
                    />
                  )}
                />
                {itemErrors?.code && <small className="p-error block mt-1">{itemErrors.code.message}</small>}
              </div>

              <div className="col-12 md:col-5">
                <label className="block text-800 font-medium mb-1 text-sm">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`items.${index}.name`}
                  control={control}
                  render={({ field: f }) => (
                    <InputText
                      {...f}
                      placeholder="Ej: Estado de la carrocería"
                      className={`p-inputtext-sm ${itemErrors?.name ? "p-invalid" : ""}`}
                    />
                  )}
                />
                {itemErrors?.name && <small className="p-error block mt-1">{itemErrors.name.message}</small>}
              </div>

              <div className="col-12 md:col-4">
                <label className="block text-800 font-medium mb-1 text-sm">
                  Tipo de respuesta <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`items.${index}.responseType`}
                  control={control}
                  render={({ field: f }) => (
                    <Dropdown
                      value={f.value}
                      onChange={(e) => f.onChange(e.value)}
                      onBlur={f.onBlur}
                      options={RESPONSE_TYPE_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      className={`p-inputtext-sm ${itemErrors?.responseType ? "p-invalid" : ""}`}
                    />
                  )}
                />
                {itemErrors?.responseType && <small className="p-error block mt-1">{itemErrors.responseType.message}</small>}
              </div>
            </div>

            {/* Fila 2: opciones (solo si es SELECTION) */}
            {responseType === "SELECTION" && (
              <div className="mb-2">
                <label className="block text-800 font-medium mb-1 text-sm">
                  Opciones (separadas por coma)
                </label>
                <Controller
                  name={`items.${index}.options`}
                  control={control}
                  render={({ field: f }) => (
                    <InputText
                      value={Array.isArray(f.value) ? f.value.join(", ") : ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const arr = raw
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        f.onChange(arr.length > 0 ? arr : null);
                      }}
                      onBlur={f.onBlur}
                      placeholder="Ej: Bueno, Regular, Malo"
                      className="p-inputtext-sm w-full"
                    />
                  )}
                />
              </div>
            )}

            {/* Fila 3: isRequired, order, botón eliminar */}
            <div className="flex align-items-center gap-3 flex-wrap">
              <div className="flex align-items-center gap-2">
                <Controller
                  name={`items.${index}.isRequired`}
                  control={control}
                  render={({ field: f }) => (
                    <Checkbox
                      inputId={`isRequired-${index}`}
                      checked={f.value ?? false}
                      onChange={(e) => f.onChange(e.checked)}
                    />
                  )}
                />
                <label htmlFor={`isRequired-${index}`} className="text-800 text-sm cursor-pointer">
                  Obligatorio
                </label>
              </div>

              <div className="flex align-items-center gap-2">
                <label className="text-800 text-sm">Orden:</label>
                <Controller
                  name={`items.${index}.order`}
                  control={control}
                  render={({ field: f }) => (
                    <InputNumber
                      value={f.value ?? index}
                      onValueChange={(e) => f.onChange(e.value ?? index)}
                      min={0}
                      showButtons
                      buttonLayout="horizontal"
                      decrementButtonClassName="p-button-secondary p-button-sm"
                      incrementButtonClassName="p-button-secondary p-button-sm"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                      style={{ width: "7rem" }}
                      inputStyle={{ width: "3rem", textAlign: "center" }}
                    />
                  )}
                />
              </div>

              <div className="ml-auto">
                <Button
                  type="button"
                  icon="pi pi-trash"
                  text
                  severity="danger"
                  rounded
                  size="small"
                  onClick={() => remove(index)}
                  tooltip="Eliminar ítem"
                  tooltipOptions={{ position: "left" }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </form>
  );
}
