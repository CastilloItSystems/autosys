import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import SupplierBillTemplate from "../templates/SupplierBillTemplate";
import type { SupplierBill } from "../interfaces/supplierBill";

const SupplierBillPDFPreview = ({ data }: { data: SupplierBill }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <SupplierBillTemplate data={data} />
  </PDFViewer>
);
export default SupplierBillPDFPreview;
