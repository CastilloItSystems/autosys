"use client";
import React from "react";
import ReceptionSignaturePanel from "../ReceptionSignaturePanel";
import type { Control, FieldErrors } from "react-hook-form";
import type { CreateReceptionForm } from "@/libs/zods/workshop/receptionZod";

interface ReceptionSignatureSectionProps {
  receptionId: string;
  currentSignature?: string | null;
  currentDiagnosticAuth?: boolean;
  onSignatureSaved?: (url: string | null) => void;
  toast: React.RefObject<any>;
  control?: Control<CreateReceptionForm>;
  errors?: FieldErrors<CreateReceptionForm>;
}

export default function ReceptionSignatureSection({
  receptionId,
  currentSignature,
  currentDiagnosticAuth,
  onSignatureSaved,
  toast,
  control,
  errors,
}: ReceptionSignatureSectionProps) {
  return (
    <ReceptionSignaturePanel
      receptionId={receptionId}
      currentSignature={currentSignature}
      currentDiagnosticAuth={currentDiagnosticAuth}
      onSaved={onSignatureSaved}
      toast={toast}
      control={control}
      errors={errors}
    />
  );
}
