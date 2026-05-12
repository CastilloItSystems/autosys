import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import CashFlowTemplate, { CashFlowTemplateData } from "../templates/CashFlowTemplate";

const CashFlowPDFPreview = ({ data }: { data: CashFlowTemplateData }) => (
  <CompanyPDFViewer>
    {(company) => <CashFlowTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default CashFlowPDFPreview;
