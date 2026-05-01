"use client";

import React, { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import WorkshopReceptionTemplate from "@/components/pdf/templates/WorkshopReceptionTemplate";
import { urlToBase64ViaProxy } from "@/modules/workshop/receptions/services/receptionPdfService";

interface ChecklistResponsePDF {
  itemName: string;
  boolValue?: boolean | null;
  textValue?: string | null;
  numValue?: number | null;
  selectionValue?: string | null;
  observation?: string | null;
}

interface DamagePDF {
  zone: string;
  description: string;
  severity: string;
  photoUrl?: string | null;
}

interface PhotoPDF {
  url: string;
  type: string;
  description?: string | null;
}

interface ReceptionPDFPreviewProps {
  folio: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehiclePlate?: string;
  vehicleDesc?: string;
  mileageIn?: number | null;
  fuelLevel?: string | null;
  accessories?: string[];
  hasPreExistingDamage: boolean;
  damageNotes?: string;
  clientDescription?: string;
  authorizationName?: string;
  authorizationPhone?: string;
  estimatedDelivery?: string | null;
  diagnosticAuthorized: boolean;
  clientSignature?: string | null;
  checklistName?: string;
  checklistResponses?: ChecklistResponsePDF[];
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehicleVin?: string | null;
  appointmentFolio?: string | null;
  serviceOrderFolio?: string | null;
  damages?: DamagePDF[];
  photos?: PhotoPDF[];
  empresaName?: string;
  empresaLogo?: string;
}

const ReceptionPDFPreview: React.FC<ReceptionPDFPreviewProps> = (props) => {
  const [processedProps, setProcessedProps] =
    useState<ReceptionPDFPreviewProps | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processImages = async () => {
      const newProps = { ...props };

      const resolveImage = async (url?: string | null) => {
        if (!url) return url;
        if (url.startsWith("data:")) return url;
        return await urlToBase64ViaProxy(url);
      };

      // Signature and Logo
      const [signatureBase64, logoBase64] = await Promise.all([
        resolveImage(props.clientSignature),
        resolveImage(props.empresaLogo),
      ]);

      newProps.clientSignature = signatureBase64;
      newProps.empresaLogo = logoBase64 ?? undefined;

      // Photos
      if (newProps.photos && newProps.photos.length > 0) {
        newProps.photos = await Promise.all(
          newProps.photos.map(async (p) => ({
            ...p,
            url: (await resolveImage(p.url)) || p.url,
          })),
        );
      }

      // Damages
      if (newProps.damages && newProps.damages.length > 0) {
        newProps.damages = await Promise.all(
          newProps.damages.map(async (d) => ({
            ...d,
            photoUrl: await resolveImage(d.photoUrl),
          })),
        );
      }

      if (isMounted) {
        setProcessedProps(newProps);
      }
    };

    processImages();

    return () => {
      isMounted = false;
    };
  }, [props]);

  if (!processedProps) {
    return (
      <div
        className="flex align-items-center justify-content-center p-4 text-center flex-column gap-3"
        style={{ height: 400 }}
      >
        <i
          className="pi pi-spin pi-spinner"
          style={{ fontSize: "2rem", color: "#2563eb" }}
        ></i>
        <span className="text-600 font-medium">
          Procesando documento y multimedia...
        </span>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
      <WorkshopReceptionTemplate data={processedProps} />
    </PDFViewer>
  );
};

export default ReceptionPDFPreview;
