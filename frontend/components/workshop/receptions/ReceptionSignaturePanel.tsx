"use client";
import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Controller } from "react-hook-form";
import PhoneInput from "@/components/common/PhoneInput";
import { receptionService } from "@/app/api/workshop";
import type { Control, FieldErrors } from "react-hook-form";
import type { CreateReceptionForm } from "@/libs/zods/workshop/receptionZod";

interface ReceptionSignaturePanelProps {
  receptionId: string;
  currentSignature?: string | null;
  currentDiagnosticAuth?: boolean;
  onSaved?: (signatureUrl: string | null) => void;
  toast: React.RefObject<any>;
  control?: Control<CreateReceptionForm>;
  errors?: FieldErrors<CreateReceptionForm>;
}

export default function ReceptionSignaturePanel({
  receptionId,
  currentSignature,
  currentDiagnosticAuth = false,
  onSaved,
  toast,
  control,
}: ReceptionSignaturePanelProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagnosticAuthorized, setDiagnosticAuthorized] = useState(
    currentDiagnosticAuth,
  );
  const [saving, setSaving] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(
    currentSignature ?? null,
  );

  useEffect(() => {
    setDiagnosticAuthorized(currentDiagnosticAuth);
    setSavedSignatureUrl(currentSignature ?? null);
  }, [currentDiagnosticAuth, currentSignature]);

  // Fix HiDPI blurry canvas
  useLayoutEffect(() => {
    if (!containerRef.current || !sigCanvasRef.current) return;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
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
  };

  const handleSave = async () => {
    const canvas = sigCanvasRef.current;
    const hasNewSignature = canvas && !canvas.isEmpty();

    // Validación: ambos requeridos
    if (!diagnosticAuthorized) {
      toast.current?.show({
        severity: "warn",
        summary: "Autorización requerida",
        detail: "El cliente debe autorizar el diagnóstico",
        life: 3000,
      });
      return;
    }

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
        // Actualizar autorización (firma ya existe)
        await receptionService.update(receptionId, { diagnosticAuthorized });
      }

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
    <div className="space-y-4">
      {/* Datos de autorización */}
      {control && (
        <div className="grid">
          <div className="col-12">
            <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
              <i className="pi pi-user text-primary" />
              <span className="font-semibold text-base text-700">
                Autorización y Entrega
              </span>
            </div>
          </div>

          <div className="col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">Nombre</label>
            <Controller
              name="authorizationName"
              control={control}
              render={({ field }) => (
                <InputText
                  id="authorizationName"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Nombre completo"
                />
              )}
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">
              Teléfono de contacto
            </label>
            <Controller
              name="authorizationPhone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="authorizationPhone"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">
              <i className="pi pi-calendar mr-2"></i>
              Entrega estimada
            </label>
            <Controller
              name="estimatedDelivery"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="estimatedDelivery"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(e) =>
                    field.onChange(e.value ? e.value.toISOString() : null)
                  }
                  showTime
                  hourFormat="24"
                  placeholder="Fecha y hora"
                  showIcon
                  className="w-full"
                />
              )}
            />
          </div>
        </div>
      )}

      {/* ══ Zona 1: Autorización ══ */}
      <div
        className="border-round p-4 flex align-items-start justify-content-between gap-4"
        style={{
          backgroundColor: "var(--surface-50)",
          borderLeft: "4px solid var(--primary-color)",
          borderTop: "1px solid var(--surface-200)",
          borderRight: "1px solid var(--surface-200)",
          borderBottom: "1px solid var(--surface-200)",
        }}
      >
        <div className="flex align-items-start gap-3 flex-grow-1">
          <Checkbox
            inputId="diagnosticAuth"
            checked={diagnosticAuthorized}
            onChange={(e) => setDiagnosticAuthorized(e.checked ?? false)}
            className="mt-1"
          />
          <label htmlFor="diagnosticAuth" className="cursor-pointer">
            <span className="block font-bold text-900">
              El cliente autoriza el diagnóstico del vehículo
            </span>
            <span className="block text-sm text-600 mt-2">
              Requerido para generar la cotización posterior.
            </span>
          </label>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {diagnosticAuthorized ? (
            <Tag severity="success" value="Autorizado" icon="pi pi-check" />
          ) : (
            <Tag severity="warning" value="Pendiente" icon="pi pi-clock" />
          )}
        </div>
      </div>

      {/* ══ Zona 2: Firma del cliente ══ */}
      <div className="border-1 border-surface-200 border-round p-4">
        {/* Header */}
        <div className="flex align-items-center justify-content-between mb-3 pb-3 border-bottom-1 border-surface-200">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-pen-to-square text-primary text-lg"></i>
            <span className="font-bold text-lg text-900">
              {savedSignatureUrl ? "Firma almacenada" : "Firma del cliente"}
            </span>
          </div>
          {savedSignatureUrl && (
            <Tag severity="success" value="Guardada" icon="pi pi-check" />
          )}
        </div>

        {/* Preview de firma guardada */}
        {savedSignatureUrl && (
          <div className="mb-4">
            <div
              className="border-1 border-surface-200 border-round surface-50 flex align-items-center justify-content-center p-3"
              style={{ minHeight: 100 }}
            >
              <img
                src={savedSignatureUrl}
                alt="Firma del cliente"
                style={{ maxWidth: "100%", maxHeight: 120 }}
              />
            </div>
          </div>
        )}

        {/* Canvas de firma */}
        <div className="mb-3">
          <div className="text-sm text-700 font-medium mb-2">
            {savedSignatureUrl ? "Actualizar firma" : "Capturar firma"}
          </div>

          <div
            ref={containerRef}
            className="border-2 border-surface-300 border-round"
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
                  cursor: "crosshair",
                },
              }}
            />
          </div>

          {/* Hint + Clear button */}
          <div className="flex align-items-center justify-content-between mt-2">
            <span className="text-500 text-xs">
              <i className="pi pi-info-circle mr-1" />
              Usa ratón o pantalla táctil para firmar
            </span>
            <Button
              label="Limpiar"
              icon="pi pi-eraser"
              text
              size="small"
              onClick={handleClear}
              type="button"
            />
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-content-end pt-2">
        <Button
          label={saving ? "Guardando..." : "Guardar Firma y Autorización"}
          icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
          severity="success"
          onClick={handleSave}
          loading={saving}
          disabled={saving}
          type="button"
        />
      </div>
    </div>
  );
}
