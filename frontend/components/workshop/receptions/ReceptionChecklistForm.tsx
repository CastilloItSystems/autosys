"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { useRef } from "react";
import checklistService from "@/app/api/workshop/checklistService";
import type {
  ChecklistTemplate,
  ChecklistItem,
} from "@/libs/interfaces/workshop/checklist.interface";

interface ChecklistResponse {
  checklistItemId: string;
  boolValue?: boolean | null;
  textValue?: string | null;
  numValue?: number | null;
  selectionValue?: string | null;
  observation?: string | null;
}

interface ReceptionChecklistFormProps {
  receptionId: string;
  templateId: string;
  onSuccess?: () => void;
  toast: React.RefObject<any>;
}

export default function ReceptionChecklistForm({
  receptionId,
  templateId,
  onSuccess,
  toast,
}: ReceptionChecklistFormProps) {
  const [responses, setResponses] = useState<Map<string, ChecklistResponse>>(
    new Map(),
  );
  const [completionPercent, setCompletionPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSavedResponses, setIsLoadingSavedResponses] = useState(false);

  // Fetch template con SWR
  const fetcher = async () => {
    if (!templateId) return null;
    const res = await checklistService.getById(templateId);
    return res.data;
  };

  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useSWR(templateId ? ["checklist-template", templateId] : null, fetcher);

  // Cargar respuestas guardadas cuando se monta el componente
  useEffect(() => {
    const loadSavedResponses = async () => {
      try {
        setIsLoadingSavedResponses(true);
        const result = await checklistService.getChecklistResponses(
          receptionId,
        );
        const responseData = result.data?.data ?? result.data;

        if (
          responseData &&
          Array.isArray(responseData) &&
          responseData.length > 0
        ) {
          const savedResponses = new Map<string, ChecklistResponse>();
          responseData.forEach((resp: any) => {
            savedResponses.set(resp.checklistItemId, {
              checklistItemId: resp.checklistItemId,
              boolValue: resp.boolValue,
              textValue: resp.textValue,
              numValue: resp.numValue ? Number(resp.numValue) : undefined,
              selectionValue: resp.selectionValue,
              observation: resp.observation,
            });
          });
          setResponses(savedResponses);
        }
      } catch (error) {
        console.log("No hay respuestas guardadas previamente");
      } finally {
        setIsLoadingSavedResponses(false);
      }
    };

    if (receptionId) {
      loadSavedResponses();
    }
  }, [receptionId]);

  // Calcular porcentaje de completitud
  useEffect(() => {
    if (!template?.items || template.items.length === 0) {
      setCompletionPercent(0);
      return;
    }

    const requiredItems = template.items.filter((item) => item.isRequired);
    const completedRequired = requiredItems.filter((item) => {
      const response = responses.get(item.id!);
      return (
        response &&
        (response.boolValue !== undefined ||
          response.textValue !== undefined ||
          response.numValue !== undefined ||
          response.selectionValue !== undefined)
      );
    });

    const percent =
      requiredItems.length > 0
        ? Math.round((completedRequired.length / requiredItems.length) * 100)
        : 100;

    setCompletionPercent(percent);
  }, [responses, template]);

  const handleResponseChange = (itemId: string, value: any) => {
    const newResponse: ChecklistResponse = {
      checklistItemId: itemId,
    };

    const item = template?.items?.find((i) => i.id === itemId);
    if (!item) return;

    switch (item.responseType) {
      case "BOOLEAN":
        newResponse.boolValue = value;
        break;
      case "TEXT":
        newResponse.textValue = value;
        break;
      case "NUMBER":
        newResponse.numValue = value ? Number(value) : null;
        break;
      case "SELECTION":
        newResponse.selectionValue = value;
        break;
    }

    setResponses((prev) => new Map(prev).set(itemId, newResponse));
  };

  const handleObservationChange = (itemId: string, observation: string) => {
    const current = responses.get(itemId) || { checklistItemId: itemId };
    current.observation = observation || null;
    setResponses((prev) => new Map(prev).set(itemId, current));
  };

  const handleSave = async () => {
    const responsesArray = Array.from(responses.values()).filter(
      (r) =>
        r.boolValue !== undefined ||
        r.textValue !== undefined ||
        r.numValue !== undefined ||
        r.selectionValue !== undefined,
    );

    if (responsesArray.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor completa al menos una respuesta",
      });
      return;
    }

    try {
      setIsSaving(true);
      await checklistService.saveChecklistResponses?.(
        receptionId,
        responsesArray,
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Respuestas del checklist guardadas correctamente",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error al guardar respuestas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar las respuestas del checklist",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (templateLoading || isLoadingSavedResponses) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Cargando checklist...</p>
      </div>
    );
  }

  if (templateError) {
    return (
      <Message
        severity="error"
        text="Error al cargar la plantilla de checklist"
      />
    );
  }

  if (!template?.items || template.items.length === 0) {
    return <Message severity="info" text="No hay ítems en esta plantilla" />;
  }

  // Contar completados
  const completedCount = template.items.filter((item) => {
    const response = responses.get(item.id!);
    return (
      response &&
      (response.boolValue !== undefined ||
        response.textValue !== undefined ||
        response.numValue !== undefined ||
        response.selectionValue !== undefined)
    );
  }).length;

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
        <i className="pi pi-list-check text-primary"></i>
        <span className="font-semibold text-base text-700">{template.name}</span>
      </div>

      {/* Progress Banner */}
      <div className="mb-4 p-3 surface-100 border-round border-left-3 border-primary">
        <div className="flex align-items-center justify-content-between mb-2">
          <span className="text-600 text-sm">
            <i className="pi pi-check-circle mr-2 text-primary"></i>
            {completedCount} de {template.items.length} ítems completados
          </span>
          <span className="font-bold text-primary">{completionPercent}%</span>
        </div>
        <ProgressBar value={completionPercent} style={{ height: "6px" }} />
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {template.items.map((item: ChecklistItem) => {
          const isCompleted = Boolean(
            responses.get(item.id!) &&
            (responses.get(item.id!)?.boolValue !== undefined ||
             responses.get(item.id!)?.textValue !== undefined ||
             responses.get(item.id!)?.numValue !== undefined ||
             responses.get(item.id!)?.selectionValue !== undefined)
          );

          return (
            <Card key={item.id} className="mb-0">
              {/* Item Header */}
              <div className="flex align-items-start justify-content-between mb-3">
                <div className="flex align-items-start gap-2 flex-grow-1">
                  <div className="flex align-items-center justify-content-center w-2rem h-2rem bg-primary border-circle text-white font-bold text-sm flex-shrink-0">
                    {item.order}
                  </div>
                  <div className="flex-grow-1">
                    <div className="flex align-items-center gap-2">
                      <span className="font-semibold text-900">{item.name}</span>
                      {item.isRequired && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-600 text-sm mt-1 mb-0">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Icon */}
                {isCompleted && (
                  <i className="pi pi-check-circle text-green-500 text-xl flex-shrink-0 ml-2"></i>
                )}
              </div>

              {/* Input Fields */}
              <div className="grid">
                {/* Boolean Response */}
                {item.responseType === "BOOLEAN" && (
                  <div className="col-12">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        label="Conforme"
                        icon="pi pi-check"
                        size="small"
                        severity={
                          responses.get(item.id!)?.boolValue === true
                            ? "success"
                            : "secondary"
                        }
                        outlined={responses.get(item.id!)?.boolValue !== true}
                        onClick={() => handleResponseChange(item.id!, true)}
                      />
                      <Button
                        type="button"
                        label="No Conforme"
                        icon="pi pi-times"
                        size="small"
                        severity={
                          responses.get(item.id!)?.boolValue === false
                            ? "danger"
                            : "secondary"
                        }
                        outlined={responses.get(item.id!)?.boolValue !== false}
                        onClick={() => handleResponseChange(item.id!, false)}
                      />
                    </div>
                  </div>
                )}

                {/* Text Response */}
                {item.responseType === "TEXT" && (
                  <div className="col-12 md:col-6">
                    <label className="block text-900 font-medium mb-1">
                      Respuesta
                    </label>
                    <InputTextarea
                      value={responses.get(item.id!)?.textValue ?? ""}
                      onChange={(e) =>
                        handleResponseChange(item.id!, e.target.value)
                      }
                      placeholder="Escribe aquí..."
                      rows={2}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Number Response */}
                {item.responseType === "NUMBER" && (
                  <div className="col-12 md:col-6">
                    <label className="block text-900 font-medium mb-1">
                      Valor Numérico
                    </label>
                    <InputNumber
                      value={responses.get(item.id!)?.numValue ?? null}
                      onValueChange={(e) =>
                        handleResponseChange(item.id!, e.value)
                      }
                      placeholder="Ingresa un número..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Selection Response */}
                {item.responseType === "SELECTION" && (
                  <div className="col-12 md:col-6">
                    <label className="block text-900 font-medium mb-1">
                      Selecciona una Opción
                    </label>
                    <Dropdown
                      value={responses.get(item.id!)?.selectionValue ?? null}
                      onChange={(e) => handleResponseChange(item.id!, e.value)}
                      options={(item.options || []).map((opt: string) => ({
                        label: opt,
                        value: opt,
                      }))}
                      placeholder="Selecciona..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Observation Field */}
                {item.responseType !== "BOOLEAN" && (
                  <div className="col-12 md:col-6">
                    <label className="block text-900 font-medium mb-1">
                      <i className="pi pi-file-edit text-sm mr-2"></i>
                      Observación (opcional)
                    </label>
                    <InputTextarea
                      value={responses.get(item.id!)?.observation ?? ""}
                      onChange={(e) =>
                        handleObservationChange(item.id!, e.target.value)
                      }
                      placeholder="Notas adicionales..."
                      rows={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-content-end mt-4 pt-3 border-top-1 border-200">
        <Button
          label="Guardar Checklist"
          icon="pi pi-check"
          severity="success"
          onClick={handleSave}
          loading={isSaving}
          disabled={completionPercent < 100 || isSaving}
        />
      </div>
    </div>
  );
}
