import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import SupplierBillTemplate from "../templates/SupplierBillTemplate";
import type { SupplierBill } from "../interfaces/supplierBill";

const SupplierBillPDFPreview = ({ data }: { data: SupplierBill }) => (
  <CompanyPDFViewer>
    {(company) => <SupplierBillTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default SupplierBillPDFPreview;
