import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ReceivablesTemplate from "../templates/ReceivablesTemplate";
import type { ReceivableItem } from "../services/receivablesService";

const ReceivablesPDFPreview = ({ data }: { data: ReceivableItem }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ReceivablesTemplate data={data} />
  </PDFViewer>
);
export default ReceivablesPDFPreview;
