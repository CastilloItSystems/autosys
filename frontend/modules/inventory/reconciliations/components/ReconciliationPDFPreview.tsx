import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ReconciliationTemplate from "../templates/ReconciliationTemplate";
import type { Reconciliation } from "../interfaces/reconciliation.interface";

const ReconciliationPDFPreview = ({ data }: { data: Reconciliation }) => (
  <CompanyPDFViewer>
    {(company) => <ReconciliationTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ReconciliationPDFPreview;
