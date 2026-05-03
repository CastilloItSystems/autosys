import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ReworkTemplate from "../templates/ReworkTemplate";
import type { WorkshopRework } from "../interfaces/rework.interface";

const ReworkPDFPreview = ({ data }: { data: WorkshopRework }) => (
  <PDFViewer width="100%" height="100%">
    <ReworkTemplate data={data} />
  </PDFViewer>
);
export default ReworkPDFPreview;
