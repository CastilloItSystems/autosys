"use client";
import React, { useCallback } from "react";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";

export interface ChecklistItemResponse {
  checklistItemId: string;
  boolValue?: boolean;
  textValue?: string;
  numValue?: number;
  selectionValue?: string;
  observation?: string;
}

export interface ChecklistItemDef {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  responseType: "BOOLEAN" | "TEXT" | "NUMBER" | "SELECTION";
  isRequired: boolean;
  order: number;
  options?: string[] | null;
}

interface DynamicChecklistProps {
  items: ChecklistItemDef[];
  responses: ChecklistItemResponse[];
  onChange: (responses: ChecklistItemResponse[]) => void;
  disabled?: boolean;
}

export default function DynamicChecklist({
  items,
  responses,
  onChange,
  disabled = false,
}: DynamicChecklistProps) {
  const getResponse = useCallback(
    (itemId: string): ChecklistItemResponse => {
      return (
        responses.find((r) => r.checklistItemId === itemId) ?? {
          checklistItemId: itemId,
        }
      );
    },
    [responses]
  );

  const updateResponse = useCallback(
    (itemId: string, patch: Partial<ChecklistItemResponse>) => {
      const existing = responses.find((r) => r.checklistItemId === itemId);
      const updated: ChecklistItemResponse = existing
        ? { ...existing, ...patch }
        : { checklistItemId: itemId, ...patch };
      const filtered = responses.filter((r) => r.checklistItemId !== itemId);
      onChange([...filtered, updated]);
    },
    [responses, onChange]
  );

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="grid">
      {sortedItems.map((item) => {
        const response = getResponse(item.id);

        return (
          <div key={item.id} className="col-12 md:col-6">
            <div className="p-3 border-1 border-round surface-border surface-50">
              {/* Label */}
              <div className="flex align-items-center gap-1 mb-2">
                <span className="font-medium text-900 text-sm">{item.name}</span>
                {item.isRequired && (
                  <span className="text-red-500 font-bold">*</span>
                )}
              </div>
              {item.description && (
                <p className="text-500 text-xs mt-0 mb-2">{item.description}</p>
              )}

              {/* Response field */}
              {item.responseType === "BOOLEAN" && (
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    inputId={`chk-${item.id}`}
                    checked={response.boolValue ?? false}
                    onChange={(e) =>
                      updateResponse(item.id, { boolValue: e.checked ?? false })
                    }
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`chk-${item.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {response.boolValue ? "Sí" : "No"}
                  </label>
                </div>
              )}

              {item.responseType === "TEXT" && (
                <>
                  {item.description?.toLowerCase().includes("multi") ? (
                    <InputTextarea
                      value={response.textValue ?? ""}
                      onChange={(e) =>
                        updateResponse(item.id, { textValue: e.target.value })
                      }
                      disabled={disabled}
                      rows={3}
                      className="w-full text-sm"
                      placeholder="Ingrese texto..."
                    />
                  ) : (
                    <InputText
                      value={response.textValue ?? ""}
                      onChange={(e) =>
                        updateResponse(item.id, { textValue: e.target.value })
                      }
                      disabled={disabled}
                      className="w-full text-sm"
                      placeholder="Ingrese texto..."
                    />
                  )}
                </>
              )}

              {item.responseType === "NUMBER" && (
                <InputNumber
                  value={response.numValue ?? null}
                  onValueChange={(e) =>
                    updateResponse(item.id, { numValue: e.value ?? undefined })
                  }
                  disabled={disabled}
                  className="w-full"
                  inputClassName="text-sm w-full"
                  placeholder="0"
                  locale="es-VE"
                />
              )}

              {item.responseType === "SELECTION" && (
                <Dropdown
                  value={response.selectionValue ?? null}
                  options={(item.options ?? []).map((opt) => ({
                    label: opt,
                    value: opt,
                  }))}
                  onChange={(e) =>
                    updateResponse(item.id, { selectionValue: e.value })
                  }
                  disabled={disabled}
                  className="w-full text-sm"
                  placeholder="Seleccionar..."
                  emptyMessage="Sin opciones"
                />
              )}

              {/* Observation */}
              <div className="mt-2">
                <InputTextarea
                  value={response.observation ?? ""}
                  onChange={(e) =>
                    updateResponse(item.id, { observation: e.target.value })
                  }
                  disabled={disabled}
                  rows={2}
                  className="w-full text-xs"
                  placeholder="Observación (opcional)..."
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
