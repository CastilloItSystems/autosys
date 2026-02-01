"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import PDFDownloadButton from "./PDFDownloadButton";
import { PDFGeneratorProps } from "@/types/pdfTypes";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

// Carga dinámica para evitar SSR del visor
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: "8px",
        border: "1px dashed #ccc",
      }}
    >
      Cargando vista previa...
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
          <PDFViewer width="100%" height="100%">
            <Template data={data} />
          </PDFViewer>
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
