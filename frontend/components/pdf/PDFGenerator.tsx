"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PDFGeneratorProps } from "@/types/pdfTypes";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

// Lazy-load the @react-pdf/renderer viewer: it is ~400KB and only needed once
// the user opens the preview dialog. This keeps react-pdf out of the shared
// chunk that CustomActionButtons (used in every list row) pulls in.
const CompanyPDFViewer = dynamic(() => import("./CompanyPDFViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="flex align-items-center justify-content-center p-4 text-center flex-column gap-3"
      style={{ height: "100%" }}
    >
      <i
        className="pi pi-spin pi-spinner"
        style={{ fontSize: "2rem", color: "#2563eb" }}
      />
      <span className="text-600 font-medium">Cargando visor PDF...</span>
    </div>
  ),
});

const PDFGenerator = <T,>({
  template: Template,
  data,
  fileName,
  showPreview = true,
  downloadText = "Descargar PDF",
}: PDFGeneratorProps<T>) => {
  const [showFullPreview, setShowFullPreview] = useState(false);

  return (
    <div className="pdf-generator m-0">
      <div className="pdf-actions">
        {/* <PDFDownloadButton
          document={<Template data={data} />}
          fileName={fileName}
        >
          {downloadText}
        </PDFDownloadButton> */}

        {showPreview && (
          <Button
            icon="pi pi-print"
            className="p-button-rounded p-button-raised p-button-text p-button-plain p-button-xs w-full sm:w-auto"
            onClick={() => setShowFullPreview(!showFullPreview)}
            // style={{ marginLeft: "10px" }}
            // className="p-button-xs w-full sm:w-auto"
            rounded
            size="small"
            tooltip="Imprimir PDF"
            tooltipOptions={{ position: "top" }}
          >
            {/* {showFullPreview ? "Ocultar Vista Previa" : "Mostrar Vista Previa"} */}
          </Button>
        )}
      </div>

      {showFullPreview && (
        <Dialog
          header="Vista previa del PDF"
          visible={showFullPreview}
          style={{ width: "80%", height: "80%" }}
          modal
          onHide={() => setShowFullPreview(false)}
          contentStyle={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <CompanyPDFViewer>
            {(company) => <Template data={data} company={company} />}
          </CompanyPDFViewer>
        </Dialog>
      )}

      <style jsx>{`
        .pdf-generator {
          margin: 30px 0;
        }
        .pdf-actions {
          display: flex;
          align-items: center;
        }
        .pdf-preview-container {
          margin-top: 20px;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PDFGenerator;
