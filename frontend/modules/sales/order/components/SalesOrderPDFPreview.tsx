import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import SalesOrderTemplate from "../templates/SalesOrderTemplate";
import type { Order } from "../interfaces/order.interface";

const SalesOrderPDFPreview = ({ data }: { data: Order }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" } as any}>
    <SalesOrderTemplate data={data} />
  </PDFViewer>
);

export default SalesOrderPDFPreview;
