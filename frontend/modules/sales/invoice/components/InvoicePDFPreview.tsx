import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import InvoiceTemplate from "../templates/InvoiceTemplate";
import type { Invoice } from "../interfaces/invoice.interface";

const InvoicePDFPreview = ({ data }: { data: Invoice }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" } as any}>
    <InvoiceTemplate data={data} />
  </PDFViewer>
);

export default InvoicePDFPreview;
