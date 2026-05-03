import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import QuotationTemplate from "../templates/QuotationTemplate";
import type { WorkshopQuotation } from "../interfaces/quotation.interface";

const QuotationPDFPreview = ({ data }: { data: WorkshopQuotation }) => (
  <PDFViewer width="100%" height="100%">
    <QuotationTemplate data={data} />
  </PDFViewer>
);
export default QuotationPDFPreview;
