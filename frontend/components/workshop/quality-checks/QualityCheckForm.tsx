"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { qualityCheckService, checklistService } from "@/app/api/workshop";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import TechnicianSelector from "@/components/common/TechnicianSelector";
import DynamicChecklist, {
  type ChecklistItemDef,
  type ChecklistItemResponse,
} from "@/components/workshop/shared/DynamicChecklist";
import type { ChecklistTemplate } from "@/libs/interfaces/workshop";

const schema = z.object({
  serviceOrderId: z.string({ required_error: "La OT es requerida" }).min(1),
  inspectorId: z.string({ required_error: "El inspector es requerido" }).min(1),
  notes: z.string().max(500).nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function QualityCheckForm({
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const [checklistTemplates, setChecklistTemplates] = useState<
    ChecklistTemplate[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDef[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<
    ChecklistItemResponse[]
  >([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { serviceOrderId: "", inspectorId: "", notes: "" },
  });

  const loadTemplates = async () => {
    if (templatesLoaded) return;
    try {
      const res = await checklistService.getAll({
        category: "QUALITY_CONTROL",
        limit: 50,
      } as any);
      setChecklistTemplates(res.data ?? []);
      setTemplatesLoaded(true);
    } catch {
      // silent — templates are optional
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setChecklistItems([]);
    setChecklistResponses([]);
    if (!templateId) return;
    setLoadingTemplate(true);
    try {
      const res = await checklistService.getById(templateId);
      const items = (res.data?.items ?? []) as ChecklistItemDef[];
      setChecklistItems(items.sort((a, b) => a.order - b.order));
    } catch (err) {
      handleFormError(err, toast.current ?? toast);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    onSubmittingChange?.(true);
    try {
      await qualityCheckService.create({
        serviceOrderId: data.serviceOrderId,
        inspectorId: data.inspectorId,
        notes: data.notes ?? undefined,
        checklistTemplateId: selectedTemplateId || undefined,
        responses:
          checklistResponses.length > 0 ? checklistResponses : undefined,
      } as any);
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const templateOptions = [
    { label: "Sin checklist", value: "" },
    ...checklistTemplates.map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <form
      id={formId ?? "quality-check-create-form"}
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
          <label className="block text-900 font-medium mb-2">
            Inspector <span className="text-red-500">*</span>
          </label>
          <Controller
            name="inspectorId"
            control={control}
            render={({ field }) => (
              <TechnicianSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.inspectorId}
              />
            )}
          />
          {errors.inspectorId && (
            <small className="p-error block mt-1">
              {errors.inspectorId.message}
            </small>
          )}
        </div>

        <div className="col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Notas iniciales
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
                placeholder="Notas previas a la inspección..."
              />
            )}
          />
        </div>

        {/* ── Checklist ── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm flex align-items-center gap-2">
              <i className="pi pi-list-check" />
              Checklist de inspección (opcional)
            </span>
          </Divider>
        </div>

        <div className="col-12">
          <label className="block text-900 font-medium mb-2">
            Plantilla de checklist
          </label>
          <Dropdown
            value={selectedTemplateId}
            options={templateOptions}
            onChange={(e) => handleTemplateChange(e.value)}
            onShow={loadTemplates}
            placeholder="Seleccionar plantilla..."
            filter
          />
        </div>

        {loadingTemplate && (
          <div className="col-12 flex justify-content-center py-3">
            <ProgressSpinner style={{ width: 32, height: 32 }} />
          </div>
        )}

        {checklistItems.length > 0 && (
          <div className="col-12">
            <DynamicChecklist
              items={checklistItems}
              responses={checklistResponses}
              onChange={setChecklistResponses}
            />
          </div>
        )}
      </div>
    </form>
  );
}
