import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import GaritaEventTemplate from "@/components/pdf/templates/GaritaEventTemplate";
import type { GaritaEvent } from "@/libs/interfaces/workshop";

interface Props {
  event: GaritaEvent & { empresaName?: string };
}

const GaritaPDFPreview: React.FC<Props> = ({ event }) => {
  return (
    <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
      <GaritaEventTemplate data={event} />
    </PDFViewer>
  );
};

export default GaritaPDFPreview;
