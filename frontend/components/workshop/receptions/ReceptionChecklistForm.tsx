"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Message } from "primereact/message";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
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
      <Card className="p-4">
        <Skeleton height="2rem" className="mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-4">
            <Skeleton height="1rem" className="mb-2" />
            <Skeleton height="2rem" />
          </div>
        ))}
      </Card>
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

  return (
    <div className="space-y-4">
      <Card title={template.name} subTitle={template.description}>
        <ProgressBar value={completionPercent} />
        <p className="text-sm text-gray-500 mt-2">
          {completionPercent}% completado
        </p>
      </Card>

      <Card>
        <div className="space-y-6">
          {template.items.map((item: ChecklistItem, index) => (
            <div key={item.id}>
              {index > 0 && <Divider />}

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {item.order}. {item.name}
                    </span>
                    {item.isRequired && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                        Requerido
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Renderizo el tipo de respuesta según responseType */}
              <div className="ml-4 mb-3">
                {item.responseType === "BOOLEAN" && (
                  <div className="flex items-center gap-3">
                    <InputSwitch
                      checked={responses.get(item.id!)?.boolValue ?? false}
                      onChange={(e) => handleResponseChange(item.id!, e.value)}
                    />
                    <span className="text-sm">
                      {responses.get(item.id!)?.boolValue
                        ? "Sí / Conforme"
                        : "No / No Conforme"}
                    </span>
                  </div>
                )}

                {item.responseType === "TEXT" && (
                  <InputTextarea
                    value={responses.get(item.id!)?.textValue ?? ""}
                    onChange={(e) =>
                      handleResponseChange(item.id!, e.target.value)
                    }
                    placeholder="Escribe tu respuesta..."
                    rows={2}
                    className="w-full"
                  />
                )}

                {item.responseType === "NUMBER" && (
                  <InputNumber
                    value={responses.get(item.id!)?.numValue ?? null}
                    onValueChange={(e) =>
                      handleResponseChange(item.id!, e.value)
                    }
                    placeholder="Ingresa un número..."
                    className="w-full"
                  />
                )}

                {item.responseType === "SELECTION" && (
                  <Dropdown
                    value={responses.get(item.id!)?.selectionValue ?? null}
                    onChange={(e) => handleResponseChange(item.id!, e.value)}
                    options={(item.options || []).map((opt: string) => ({
                      label: opt,
                      value: opt,
                    }))}
                    placeholder="Selecciona una opción..."
                    className="w-full"
                  />
                )}
              </div>

              {/* Campo de observación */}
              <div className="ml-4">
                <label className="block text-sm font-medium mb-1">
                  Observaciones (opcional)
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
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          label="Guardar Respuestas"
          icon="pi pi-check"
          onClick={handleSave}
          loading={isSaving}
          disabled={completionPercent < 100 || isSaving}
          severity={completionPercent === 100 ? "success" : "secondary"}
        />
      </div>
    </div>
  );
}
