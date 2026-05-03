import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import PaymentReceiptTemplate from "../templates/PaymentReceiptTemplate";
import type { Payment } from "../interfaces/payment.interface";

const PaymentReceiptPDFPreview = ({ data }: { data: Payment }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" } as any}>
    <PaymentReceiptTemplate data={data} />
  </PDFViewer>
);

export default PaymentReceiptPDFPreview;
