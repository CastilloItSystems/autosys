import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ExitNoteTemplate from "../templates/ExitNoteTemplate";
import type { ExitNote } from "../interfaces/exitNote.interface";

const ExitNotePDFPreview = ({ data }: { data: ExitNote }) => (
  <CompanyPDFViewer>
    {(company) => <ExitNoteTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ExitNotePDFPreview;
