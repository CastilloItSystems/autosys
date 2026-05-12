import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import PreInvoiceTemplate from "../templates/PreInvoiceTemplate";
import type { PreInvoice } from "../interfaces/preInvoice.interface";

const PreInvoicePDFPreview = ({ data }: { data: PreInvoice }) => (
  <CompanyPDFViewer>
    {(company) => <PreInvoiceTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);

export default PreInvoicePDFPreview;
