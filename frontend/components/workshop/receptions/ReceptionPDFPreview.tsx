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
    const res = await fetch(`/api/proxy/image?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const { dataUrl } = await res.json();
    return dataUrl ?? null;
  } catch {
    return null;
  }
};

const ReceptionPDFPreview: React.FC<ReceptionPDFPreviewProps> = (props) => {
  const [signatureBase64, setSignatureBase64] = useState<
    string | null | undefined
  >(undefined);

  useEffect(() => {
    if (!props.clientSignature) {
      setSignatureBase64(null);
    } else if (props.clientSignature.startsWith("data:")) {
      // Ya es base64, no necesita conversión
      setSignatureBase64(props.clientSignature);
    } else if (props.clientSignature.startsWith("http")) {
      // URL de R2 → usa proxy para evitar CORS
      urlToBase64ViaProxy(props.clientSignature)
        .then(setSignatureBase64)
        .catch(() => setSignatureBase64(null));
    } else {
      setSignatureBase64(null);
    }
  }, [props.clientSignature]);

  // Esperar hasta que se convierta la firma
  if (signatureBase64 === undefined) {
    return (
      <div
        className="flex align-items-center justify-content-center p-4"
        style={{ height: 400 }}
      >
        Cargando firma...
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
      <WorkshopReceptionTemplate
        data={{ ...props, clientSignature: signatureBase64 }}
      />
    </PDFViewer>
  );
};

export default ReceptionPDFPreview;
