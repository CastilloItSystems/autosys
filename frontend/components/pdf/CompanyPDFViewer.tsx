"use client";

import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import type { PdfCompanyInfo } from "./pdfCompany";
import { usePdfCompanyInfo } from "./pdfCompany";

interface CompanyPDFViewerProps {
  children: (company: PdfCompanyInfo) => React.ReactElement;
  width?: string | number;
  height?: string | number;
  style?: any;
}

const defaultViewerStyle = { border: "none" };

const CompanyPDFViewer = ({
  children,
  width = "100%",
  height = "100%",
  style = defaultViewerStyle,
}: CompanyPDFViewerProps) => {
  const { company, isLoadingLogo } = usePdfCompanyInfo();

  if (isLoadingLogo) {
    return (
      <div
        className="flex align-items-center justify-content-center p-4 text-center flex-column gap-3"
        style={{ height }}
      >
        <i
          className="pi pi-spin pi-spinner"
          style={{ fontSize: "2rem", color: "#2563eb" }}
        />
        <span className="text-600 font-medium">
          Preparando datos de empresa...
        </span>
      </div>
    );
  }

  return (
    <PDFViewer width={width} height={height} style={style}>
      {children(company)}
    </PDFViewer>
  );
};

export default CompanyPDFViewer;
