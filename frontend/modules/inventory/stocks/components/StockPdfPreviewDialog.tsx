"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import stockBulkService, {
  IStockExportRequest,
} from "@/modules/inventory/bulk/services/stockBulkService";
import StockExportTemplate, {
  StockExportRow,
} from "../templates/StockExportTemplate";

// Tope de filas para el render en navegador (react-pdf). Por encima de esto
// conviene usar Excel; se avisa en el propio PDF.
const PDF_ROW_LIMIT = 1500;

interface Props {
  visible: boolean;
  onHide: () => void;
  filters?: IStockExportRequest["filters"];
  filtersSummary?: string;
}

const StockPdfPreviewDialog = ({
  visible,
  onHide,
  filters,
  filtersSummary,
}: Props) => {
  const toast = useRef<Toast>(null);
  const [rows, setRows] = useState<StockExportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [note, setNote] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!visible) {
      setRows(null);
      setNote(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRows(null);

    (async () => {
      try {
        const blob = await stockBulkService.exportStock({
          format: "json",
          filters,
        });
        const text = await blob.text();
        const parsed: StockExportRow[] = JSON.parse(text);
        if (!cancelled) {
          const all = Array.isArray(parsed) ? parsed : [];
          if (all.length > PDF_ROW_LIMIT) {
            setRows(all.slice(0, PDF_ROW_LIMIT));
            setNote(
              `Mostrando los primeros ${PDF_ROW_LIMIT.toLocaleString(
                "es-VE",
              )} de ${all.length.toLocaleString(
                "es-VE",
              )} registros. Para el listado completo, exporte a Excel desde "Más opciones".`,
            );
          } else {
            setRows(all);
            setNote(undefined);
          }
          setGeneratedAt(
            new Date().toLocaleString("es-VE", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setRows([]);
          toast.current?.show({
            severity: "error",
            summary: "Error al generar el PDF",
            detail: err?.message ?? "No se pudo obtener el listado de stock",
            life: 4000,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, filters]);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      maximizable
      modal
      style={{ width: "85vw", height: "90vh" }}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-file-pdf mr-3 text-primary text-3xl"></i>
              Reporte de Stock (PDF)
            </h2>
          </div>
        </div>
      }
    >
      <Toast ref={toast} />
      {loading || rows === null ? (
        <div className="flex flex-column align-items-center justify-content-center gap-3 h-full">
          <ProgressSpinner style={{ width: "3rem", height: "3rem" }} />
          <span className="text-600 font-medium">Generando reporte...</span>
        </div>
      ) : (
        <CompanyPDFViewer height="100%">
          {(company) => (
            <StockExportTemplate
              rows={rows}
              company={company}
              generatedAt={generatedAt}
              filtersSummary={filtersSummary}
              note={note}
            />
          )}
        </CompanyPDFViewer>
      )}
    </Dialog>
  );
};

export default StockPdfPreviewDialog;
