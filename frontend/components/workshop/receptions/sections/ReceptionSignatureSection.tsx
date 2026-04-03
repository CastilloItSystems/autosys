"use client";
import React from "react";
import ReceptionSignaturePanel from "../ReceptionSignaturePanel";

interface ReceptionSignatureSectionProps {
  receptionId: string;
  currentSignature?: string | null;
  currentDiagnosticAuth?: boolean;
  onSignatureSaved?: (url: string | null) => void;
  toast: React.RefObject<any>;
}

export default function ReceptionSignatureSection({
  receptionId,
  currentSignature,
  currentDiagnosticAuth,
  onSignatureSaved,
  toast,
}: ReceptionSignatureSectionProps) {
  return (
    <ReceptionSignaturePanel
      receptionId={receptionId}
      currentSignature={currentSignature}
      currentDiagnosticAuth={currentDiagnosticAuth}
      onSaved={onSignatureSaved}
      toast={toast}
    />
  );
}
