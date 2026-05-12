import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import CreditNoteTemplate from "../templates/CreditNoteTemplate";
import type { CreditNote } from "../interfaces/creditNote.interface";

const CreditNotePDFPreview = ({ data }: { data: CreditNote }) => (
  <CompanyPDFViewer>
    {(company) => <CreditNoteTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);

export default CreditNotePDFPreview;
