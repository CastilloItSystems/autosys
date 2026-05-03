import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import CRMQuoteTemplate from "../templates/CRMQuoteTemplate";
import type { Quote } from "../interfaces/quote.interface";

const CRMQuotePDFPreview = ({ data }: { data: Quote }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <CRMQuoteTemplate data={data} />
  </PDFViewer>
);
export default CRMQuotePDFPreview;
