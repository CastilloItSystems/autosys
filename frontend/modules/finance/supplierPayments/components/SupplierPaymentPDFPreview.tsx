import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import SupplierPaymentTemplate from "../templates/SupplierPaymentTemplate";
import type { SupplierPayment } from "../interfaces/supplierPayment";

const SupplierPaymentPDFPreview = ({ data }: { data: SupplierPayment }) => (
  <CompanyPDFViewer>
    {(company) => <SupplierPaymentTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default SupplierPaymentPDFPreview;
