import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import SupplierPaymentTemplate from "../templates/SupplierPaymentTemplate";
import type { SupplierPayment } from "../interfaces/supplierPayment";

const SupplierPaymentPDFPreview = ({ data }: { data: SupplierPayment }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <SupplierPaymentTemplate data={data} />
  </PDFViewer>
);
export default SupplierPaymentPDFPreview;
