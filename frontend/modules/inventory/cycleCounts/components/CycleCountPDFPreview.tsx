import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import CycleCountResultsTemplate from "../templates/CycleCountResultsTemplate";
import type { CycleCount } from "../interfaces/cycleCount.interface";

const CycleCountPDFPreview = ({ data }: { data: CycleCount }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <CycleCountResultsTemplate data={data} />
  </PDFViewer>
);
export default CycleCountPDFPreview;
