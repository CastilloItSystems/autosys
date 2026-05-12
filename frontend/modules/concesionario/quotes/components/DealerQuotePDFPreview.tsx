import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import DealerQuoteTemplate from "../templates/DealerQuoteTemplate";
import type { DealerQuote } from "../interfaces/dealerQuote.interface";

const DealerQuotePDFPreview = ({ data }: { data: DealerQuote }) => (
  <CompanyPDFViewer>
    {(company) => <DealerQuoteTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default DealerQuotePDFPreview;
