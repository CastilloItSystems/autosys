import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import InvoiceTemplate from "../templates/InvoiceTemplate";
import type { Invoice } from "../interfaces/invoice.interface";

const InvoicePDFPreview = ({ data }: { data: Invoice }) => (
  <CompanyPDFViewer>
    {(company) => <InvoiceTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);

export default InvoicePDFPreview;
