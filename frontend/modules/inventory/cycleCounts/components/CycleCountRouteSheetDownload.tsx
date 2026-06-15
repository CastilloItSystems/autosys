"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "primereact/button";
import { usePdfCompanyInfo } from "@/components/pdf/pdfCompany";
import type { CycleCount } from "@/modules/inventory/cycleCounts/interfaces/cycleCount.interface";
import CycleCountRouteSheetPDF from "./CycleCountRouteSheetPDF";

interface CycleCountRouteSheetDownloadProps {
  cycleCount: CycleCount;
  warehouseName?: string;
  cycleCountNumber: string | number;
}

/**
 * Botón de descarga de la hoja de ruta en PDF. Aislado en su propio módulo para
 * que `@react-pdf/renderer` (~400KB) se cargue de forma diferida (next/dynamic)
 * y no entre en el bundle de la ruta de conteos cíclicos.
 */
const CycleCountRouteSheetDownload = ({
  cycleCount,
  warehouseName,
  cycleCountNumber,
}: CycleCountRouteSheetDownloadProps) => {
  const { company } = usePdfCompanyInfo();

  return (
    <PDFDownloadLink
      document={
        <CycleCountRouteSheetPDF
          cycleCount={cycleCount as any}
          warehouseName={warehouseName}
          company={company}
        />
      }
      fileName={`hoja-ruta-${cycleCountNumber}.pdf`}
    >
      {({ loading }) => (
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          severity="danger"
          outlined
          size="small"
          loading={loading}
          tooltip="Descargar hoja de ruta PDF"
          tooltipOptions={{ position: "left" }}
        />
      )}
    </PDFDownloadLink>
  );
};

export default CycleCountRouteSheetDownload;
