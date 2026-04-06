"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import dynamic from "next/dynamic";
import receptionMediaService, {
  type ReceptionDamage,
  type ReceptionPhoto,
} from "@/app/api/workshop/receptionMediaService";
import type {
  VehicleReception,
  ReceptionStatus,
} from "@/libs/interfaces/workshop";
import { useEmpresasStore } from "@/store/empresasStore";

const ReceptionPDFPreview = dynamic(() => import("./ReceptionPDFPreview"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-4">Generando comprobante...</div>
  ),
});

interface ProgressItem {
  label: string;
  completed: boolean;
  required?: boolean;
}

interface ReceptionHeaderProps {
  reception: VehicleReception | null;
  currentSignature?: string | null;
  checklistTemplateName?: string;
  checklistResponses?: any[];
  progressItems?: ProgressItem[];
}

const STATUS_MAP: Record<ReceptionStatus, { label: string; classes: string }> =
  {
    OPEN: {
      label: "Abierta",
      classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    DIAGNOSING: {
      label: "En diagnóstico",
      classes: "bg-blue-50 text-blue-700 border-blue-200",
    },
    QUOTED: {
      label: "Cotizada",
      classes: "bg-purple-50 text-purple-700 border-purple-200",
    },
    CONVERTED_TO_SO: {
      label: "OT generada",
      classes: "bg-green-50 text-green-700 border-green-200",
    },
  };

export default function ReceptionHeader({
  reception,
  currentSignature,
  checklistTemplateName,
  checklistResponses,
  progressItems = [],
}: ReceptionHeaderProps) {
  const { activeEmpresa } = useEmpresasStore();
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [pdfDamages, setPdfDamages] = useState<ReceptionDamage[]>([]);
  const [pdfPhotos, setPdfPhotos] = useState<ReceptionPhoto[]>([]);

  const status = reception?.status ? STATUS_MAP[reception.status] : null;

  const handleOpenPDF = async () => {
    if (!reception?.id) return;

    setLoadingPDF(true);
    try {
      const [dmgRes, phRes] = await Promise.all([
        receptionMediaService.getDamages(reception.id),
        receptionMediaService.getPhotos(reception.id),
      ]);
      setPdfDamages(dmgRes.data ?? []);
      setPdfPhotos(phRes.data ?? []);
      setShowPDFPreview(true);
    } catch (error) {
      console.error("Error al cargar daños y fotos:", error);
      // Abrir PDF igual aunque falle la carga de media
      setShowPDFPreview(true);
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <>
      {/* Info bar — fixed at top of dialog, content scrolls below */}
      <div className="surface-0 border-bottom-1 border-200 px-3 py-2 flex align-items-center justify-content-between gap-3 flex-shrink-0">
        {/* Left: datos clave */}
        <div className="flex align-items-center gap-3 min-w-0">
          {reception?.folio ? (
            <>
              <span className="font-bold text-900 text-base white-space-nowrap">
                {reception.folio}
              </span>
              {status && (
                <span
                  className={`text-xs font-semibold px-2 py-1 border-round border-1 white-space-nowrap ${status.classes}`}
                >
                  {status.label}
                </span>
              )}
              {reception.vehiclePlate && (
                <span className="text-sm text-600 hidden md:inline white-space-nowrap">
                  <i className="pi pi-car mr-1 text-400" />
                  {reception.vehiclePlate}
                </span>
              )}
              {reception.customer?.name && (
                <span className="text-sm text-600 hidden lg:inline white-space-nowrap overflow-hidden text-overflow-ellipsis">
                  <i className="pi pi-user mr-1 text-400" />
                  {reception.customer.name}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-500 font-medium">
              Nueva recepción
            </span>
          )}
        </div>

        {/* Right: stepper de progreso + PDF */}
        <div className="flex align-items-center gap-3 flex-shrink-0">
          {/* Stepper con labels */}
          {progressItems.length > 0 && (
            <div className="align-items-center gap-1 hidden lg:flex">
              {progressItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      className={`border-top-1 ${
                        item.completed ? "border-green-400" : "border-200"
                      }`}
                      style={{ width: 16 }}
                    />
                  )}
                  <div className="flex align-items-center gap-1">
                    <div
                      className={`flex align-items-center justify-content-center border-circle font-bold ${
                        item.completed
                          ? "bg-green-500 text-white"
                          : item.required
                          ? "bg-orange-100 text-orange-600 border-1 border-orange-300"
                          : "surface-200 text-500"
                      }`}
                      style={{ width: 18, height: 18, fontSize: 9 }}
                    >
                      {item.completed ? (
                        <i className="pi pi-check" style={{ fontSize: 8 }} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs white-space-nowrap ${
                        item.completed
                          ? "text-green-600 font-medium"
                          : item.required
                          ? "text-orange-600"
                          : "text-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Botón PDF solo para recepciones guardadas */}
          {reception?.id && (
            <Button
              icon={loadingPDF ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"}
              tooltip="Ver comprobante PDF"
              tooltipOptions={{ position: "left" }}
              onClick={handleOpenPDF}
              loading={loadingPDF}
              disabled={loadingPDF}
              className="p-button-text p-button-secondary p-button-sm"
              type="button"
            />
          )}
        </div>
      </div>

      {/* PDF Preview Dialog */}
      {reception?.id && (
        <Dialog
          header={`Comprobante - ${reception.folio}`}
          visible={showPDFPreview}
          style={{ width: "90vw", height: "90vh" }}
          modal
          maximizable
          onHide={() => setShowPDFPreview(false)}
          contentStyle={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
          footer={
            <div className="flex gap-2 justify-content-end">
              <Button
                label="Cerrar"
                icon="pi pi-times"
                onClick={() => setShowPDFPreview(false)}
                className="p-button-text"
              />
              <Button
                label="Imprimir"
                icon="pi pi-print"
                onClick={() => window.print()}
                className="p-button-primary"
              />
            </div>
          }
        >
          <ReceptionPDFPreview
            folio={reception.folio}
            status={reception.status ?? "OPEN"}
            createdAt={reception.createdAt}
            customerName={reception.customer?.name ?? "—"}
            customerPhone={(reception.customer as any)?.phone ?? undefined}
            customerEmail={(reception.customer as any)?.email ?? undefined}
            vehiclePlate={reception.vehiclePlate ?? undefined}
            vehicleDesc={reception.vehicleDesc ?? undefined}
            mileageIn={reception.mileageIn}
            fuelLevel={reception.fuelLevel}
            accessories={reception.accessories ?? []}
            hasPreExistingDamage={reception.hasPreExistingDamage}
            damageNotes={reception.damageNotes ?? undefined}
            clientDescription={reception.clientDescription ?? undefined}
            authorizationName={reception.authorizationName ?? undefined}
            authorizationPhone={reception.authorizationPhone ?? undefined}
            estimatedDelivery={reception.estimatedDelivery ?? undefined}
            diagnosticAuthorized={reception.diagnosticAuthorized ?? false}
            clientSignature={currentSignature}
            checklistName={checklistTemplateName || undefined}
            checklistResponses={
              checklistResponses && checklistResponses.length > 0
                ? checklistResponses
                : undefined
            }
            vehicleBrand={
              (reception.customerVehicle as any)?.brand?.name ?? undefined
            }
            vehicleModel={
              (reception.customerVehicle as any)?.vehicleModel?.name ??
              undefined
            }
            vehicleYear={(reception.customerVehicle as any)?.year ?? undefined}
            vehicleColor={
              (reception.customerVehicle as any)?.color ?? undefined
            }
            vehicleVin={(reception.customerVehicle as any)?.vin ?? undefined}
            appointmentFolio={
              (reception.appointment as any)?.folio ?? undefined
            }
            serviceOrderFolio={
              (reception.serviceOrder as any)?.folio ?? undefined
            }
            damages={pdfDamages}
            photos={pdfPhotos}
            empresaName={activeEmpresa?.name}
            empresaLogo={activeEmpresa?.logoUrl}
          />
        </Dialog>
      )}
    </>
  );
}
