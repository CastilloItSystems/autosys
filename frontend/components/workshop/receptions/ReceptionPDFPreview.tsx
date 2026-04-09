import React, { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import WorkshopReceptionTemplate from "@/components/pdf/templates/WorkshopReceptionTemplate";

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

const urlToBase64ViaProxy = async (url: string): Promise<string | null> => {
  try {
    let absoluteUrl = url;
    if (url.startsWith("/")) {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api";
      // Si la base termina en /api, la quitamos para apuntar a la raíz del backend
      const backendRoot = apiBase.replace(/\/api\/?$/, "");
      absoluteUrl = `${backendRoot}${url}`;
    }

    // Y en caso de que sea del mismo frontend (public local)
    if (
      url.startsWith("/templates") ||
      url.startsWith("/images") ||
      url.startsWith("/logo") ||
      url.startsWith("/favicon")
    ) {
      absoluteUrl = `${window.location.origin}${url}`;
    }

    // Force IPv4 for local dev to avoid Node fetch IPv6 issues
    if (absoluteUrl.includes("localhost")) {
      absoluteUrl = absoluteUrl.replace("localhost", "127.0.0.1");
    }

    console.log("Resolving image proxy for:", url, "->", absoluteUrl);

    const res = await fetch(
      `/api/proxy/image?url=${encodeURIComponent(absoluteUrl)}`,
    );
    if (!res.ok) {
      console.warn(`Proxy falló para ${absoluteUrl}:`, res.statusText);
      return null;
    }
    const { dataUrl } = await res.json();
    return dataUrl ?? null;
  } catch (error) {
    console.error("Error convirtiendo a base64:", error);
    return null;
  }
};

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
