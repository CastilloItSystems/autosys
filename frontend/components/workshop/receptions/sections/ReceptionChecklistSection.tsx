"use client";
import React from "react";
import ReceptionChecklistForm from "../ReceptionChecklistForm";
import ChecklistTemplateSelector from "@/components/workshop/checklists/ChecklistTemplateSelector";

interface ReceptionChecklistSectionProps {
  receptionId: string;
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  toast: React.RefObject<any>;
}

export default function ReceptionChecklistSection({
  receptionId,
  selectedTemplateId,
  onTemplateSelect,
  toast,
}: ReceptionChecklistSectionProps) {
  return selectedTemplateId ? (
    <ReceptionChecklistForm
      receptionId={receptionId}
      templateId={selectedTemplateId}
      toast={toast}
    />
  ) : (
    <div className="flex flex-column align-items-center gap-3 py-5">
      <i className="pi pi-list text-6xl text-300" />
      <div className="text-center">
        <p className="text-600 m-0 mb-3 text-lg">
          Selecciona una plantilla de inspección para comenzar
        </p>
        <ChecklistTemplateSelector onSelect={onTemplateSelect} />
      </div>
    </div>
  );
}
