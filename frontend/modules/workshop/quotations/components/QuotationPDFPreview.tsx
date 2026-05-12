import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import QuotationTemplate from "../templates/QuotationTemplate";
import type { WorkshopQuotation } from "../interfaces/quotation.interface";

const QuotationPDFPreview = ({ data }: { data: WorkshopQuotation }) => (
  <CompanyPDFViewer>
    {(company) => <QuotationTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default QuotationPDFPreview;
