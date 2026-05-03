import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import CashFlowTemplate, { CashFlowTemplateData } from "../templates/CashFlowTemplate";

const CashFlowPDFPreview = ({ data }: { data: CashFlowTemplateData }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <CashFlowTemplate data={data} />
  </PDFViewer>
);
export default CashFlowPDFPreview;
