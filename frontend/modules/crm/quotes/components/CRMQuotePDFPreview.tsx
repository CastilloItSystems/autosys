import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import CRMQuoteTemplate from "../templates/CRMQuoteTemplate";
import type { Quote } from "../interfaces/quote.interface";

const CRMQuotePDFPreview = ({ data }: { data: Quote }) => (
  <CompanyPDFViewer>
    {(company) => <CRMQuoteTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default CRMQuotePDFPreview;
