import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import PurchaseOrderTemplate from "../templates/PurchaseOrderTemplate";
import type { PurchaseOrder } from "../interfaces/purchaseOrder.interface";

const PurchaseOrderPDFPreview = ({ data }: { data: PurchaseOrder }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <PurchaseOrderTemplate data={data} />
  </PDFViewer>
);
export default PurchaseOrderPDFPreview;
