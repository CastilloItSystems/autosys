"use client";
import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { receptionService } from "@/app/api/workshop";

interface ReceptionSignaturePanelProps {
  receptionId: string;
  currentSignature?: string | null;
  currentDiagnosticAuth?: boolean;
  onSaved?: (signatureUrl: string | null) => void;
  toast: React.RefObject<any>;
}

export default function ReceptionSignaturePanel({
  receptionId,
  currentSignature,
  currentDiagnosticAuth = false,
  onSaved,
  toast,
}: ReceptionSignaturePanelProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagnosticAuthorized, setDiagnosticAuthorized] = useState(currentDiagnosticAuth);
  const [saving, setSaving] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!currentSignature);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(currentSignature ?? null);

  useEffect(() => {
    setDiagnosticAuthorized(currentDiagnosticAuth);
    setSavedSignatureUrl(currentSignature ?? null);
    setHasSignature(!!currentSignature);
  }, [currentDiagnosticAuth, currentSignature]);

  // Fix HiDPI blurry canvas
  useLayoutEffect(() => {
    if (!containerRef.current || !sigCanvasRef.current) return;
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    const w = containerRef.current.offsetWidth;
    const canvas = sigCanvasRef.current.getCanvas();
    canvas.width = w * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "200px";
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);
  }, []);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
  };

  const handleEnd = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setHasSignature(true);
    }
  };

  const handleSave = async () => {
    const canvas = sigCanvasRef.current;
    const hasNewSignature = canvas && !canvas.isEmpty();

    if (!hasNewSignature && !savedSignatureUrl) {
      toast.current?.show({
        severity: "warn",
        summary: "Firma requerida",
        detail: "El cliente debe firmar antes de guardar",
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      let finalUrl: string | null = savedSignatureUrl;
      let signatureForPDF: string | null = null;

      if (hasNewSignature) {
        const base64 = canvas.toDataURL("image/png");
        signatureForPDF = base64;
        const result = await receptionService.uploadSignature(
          receptionId,
          base64,
          diagnosticAuthorized,
        );
        finalUrl = result.data?.signatureUrl ?? base64;
        setSavedSignatureUrl(finalUrl);
      } else {
        await receptionService.update(receptionId, { diagnosticAuthorized });
      }

      setHasSignature(true);
      toast.current?.show({
        severity: "success",
        summary: "Firma guardada",
        detail: "La firma y autorización se guardaron correctamente",
        life: 3000,
      });

      onSaved?.(signatureForPDF ?? finalUrl);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error al guardar",
        detail: error?.response?.data?.message || "No se pudo guardar la firma",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-fluid">
      {/* Autorización de diagnóstico */}
      <div className="border-1 border-200 border-round p-3 mb-4 surface-50">
        <div className="flex align-items-center gap-3">
          <Checkbox
            inputId="diagnosticAuth"
            checked={diagnosticAuthorized}
            onChange={(e) => setDiagnosticAuthorized(e.checked ?? false)}
          />
          <label htmlFor="diagnosticAuth" className="text-900 font-semibold cursor-pointer">
            El cliente autoriza el diagnóstico del vehículo
          </label>
          {diagnosticAuthorized && (
            <Tag severity="success" value="Autorizado" icon="pi pi-check" />
          )}
        </div>
        <p className="text-600 text-sm mt-2 mb-0 ml-5">
          Al marcar esta casilla, el cliente confirma que autoriza la revisión y
          diagnóstico del vehículo por parte del taller.
        </p>
      </div>

      <Divider align="left">
        <span className="text-700 font-semibold text-sm">Firma del cliente</span>
      </Divider>

      {/* Firma guardada */}
      {savedSignatureUrl && (
        <div className="mb-4">
          <div className="flex align-items-center justify-content-between mb-2">
            <span className="text-700 font-semibold text-sm">Firma almacenada</span>
            <Tag severity="success" value="Guardada" icon="pi pi-check" />
          </div>
          <div
            className="border-1 border-200 border-round p-2 flex align-items-center justify-content-center surface-50"
            style={{ minHeight: 100 }}
          >
            <img
              src={savedSignatureUrl}
              alt="Firma del cliente"
              style={{ maxWidth: "100%", maxHeight: 140 }}
            />
          </div>
        </div>
      )}

      {/* Canvas de firma */}
      <div className="mb-3">
        <div className="flex align-items-center justify-content-between mb-2">
          <span className="text-700 font-semibold text-sm">
            {savedSignatureUrl ? "Actualizar firma" : "Capturar firma"}
          </span>
          <Button
            label="Limpiar"
            icon="pi pi-eraser"
            className="p-button-text p-button-sm"
            onClick={handleClear}
            type="button"
          />
        </div>

        <div
          ref={containerRef}
          className="border-1 border-300 border-round"
          style={{ backgroundColor: "#fff", touchAction: "none" }}
        >
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            canvasProps={{
              style: {
                width: "100%",
                height: "200px",
                borderRadius: "6px",
                display: "block",
              },
            }}
            onEnd={handleEnd}
          />
        </div>

        <p className="text-500 text-xs mt-2 mb-0">
          <i className="pi pi-info-circle mr-1" />
          Dibuje la firma del cliente usando el ratón o pantalla táctil
        </p>
      </div>

      <div className="flex justify-content-end">
        <Button
          label={saving ? "Guardando..." : "Guardar Firma y Autorización"}
          icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"}
          onClick={handleSave}
          disabled={saving || (!hasSignature && !savedSignatureUrl)}
          className="p-button-success"
          type="button"
        />
      </div>
    </div>
  );
}
