import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import PurchaseOrderTemplate from "../templates/PurchaseOrderTemplate";
import type { PurchaseOrder } from "../interfaces/purchaseOrder.interface";

const PurchaseOrderPDFPreview = ({ data }: { data: PurchaseOrder }) => (
  <CompanyPDFViewer>
    {(company) => <PurchaseOrderTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default PurchaseOrderPDFPreview;
