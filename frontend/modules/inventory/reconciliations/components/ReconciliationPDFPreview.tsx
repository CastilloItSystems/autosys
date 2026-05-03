import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ReconciliationTemplate from "../templates/ReconciliationTemplate";
import type { Reconciliation } from "../interfaces/reconciliation.interface";

const ReconciliationPDFPreview = ({ data }: { data: Reconciliation }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ReconciliationTemplate data={data} />
  </PDFViewer>
);
export default ReconciliationPDFPreview;
