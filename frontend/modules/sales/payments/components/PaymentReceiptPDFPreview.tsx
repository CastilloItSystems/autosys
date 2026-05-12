import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import PaymentReceiptTemplate from "../templates/PaymentReceiptTemplate";
import type { Payment } from "../interfaces/payment.interface";

const PaymentReceiptPDFPreview = ({ data }: { data: Payment }) => (
  <CompanyPDFViewer>
    {(company) => <PaymentReceiptTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);

export default PaymentReceiptPDFPreview;
