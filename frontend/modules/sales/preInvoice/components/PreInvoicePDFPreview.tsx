import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import PreInvoiceTemplate from "../templates/PreInvoiceTemplate";
import type { PreInvoice } from "../interfaces/preInvoice.interface";

const PreInvoicePDFPreview = ({ data }: { data: PreInvoice }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" } as any}>
    <PreInvoiceTemplate data={data} />
  </PDFViewer>
);

export default PreInvoicePDFPreview;
