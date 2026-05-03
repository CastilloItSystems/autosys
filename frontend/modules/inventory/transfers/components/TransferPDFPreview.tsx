import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import TransferTemplate from "../templates/TransferTemplate";
import type { Transfer } from "../interfaces/transfer.interface";

const TransferPDFPreview = ({ data }: { data: Transfer }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <TransferTemplate data={data} />
  </PDFViewer>
);
export default TransferPDFPreview;
