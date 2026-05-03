import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import AdjustmentTemplate from "../templates/AdjustmentTemplate";
import type { Adjustment } from "../services/adjustmentService";

const AdjustmentPDFPreview = ({ data }: { data: Adjustment }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <AdjustmentTemplate data={data} />
  </PDFViewer>
);
export default AdjustmentPDFPreview;
