"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Message } from "primereact/message";
import checklistService from "@/app/api/workshop/checklistService";
import type { ChecklistTemplate } from "@/libs/interfaces/workshop/checklist.interface";

interface ChecklistTemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

export default function ChecklistTemplateSelector({
  onSelect,
}: ChecklistTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const fetcher = async () => {
    const res = await checklistService.getAll({
      category: "RECEPTION",
      isActive: true,
    });
    return res.data || [];
  };

  const {
    data: templates,
    isLoading,
    error,
  } = useSWR("checklist-templates-reception", fetcher);

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      setSelectedTemplate(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton height="2rem" className="mb-4" />
        <Skeleton height="3rem" />
      </Card>
    );
  }

  if (error) {
    return (
      <Message
        severity="error"
        text="Error al cargar las plantillas de checklist"
      />
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Message
        severity="info"
        text="No hay plantillas de checklist disponibles para recepciones"
      />
    );
  }

  return (
    <Card title="Seleccionar Plantilla de Inspección">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Elige una plantilla de inspección para llenar el checklist con los
          puntos de verificación configurados.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">
            Plantilla <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.value)}
            options={templates.map((t) => ({
              label: `${t.name}${t.description ? ` - ${t.description}` : ""}`,
              value: t.id,
            }))}
            placeholder="Selecciona una plantilla..."
            className="w-full"
          />
        </div>

        <Button
          label="Comienza el Checklist"
          icon="pi pi-arrow-right"
          onClick={handleSelect}
          disabled={!selectedTemplate}
          className="w-full"
        />
      </div>
    </Card>
  );
}
