import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ReturnTemplate from "../templates/ReturnTemplate";
import type { ReturnOrder } from "../interfaces/return.interface";

const ReturnPDFPreview = ({ data }: { data: ReturnOrder }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ReturnTemplate data={data} />
  </PDFViewer>
);
export default ReturnPDFPreview;
