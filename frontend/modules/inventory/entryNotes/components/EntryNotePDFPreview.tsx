import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import EntryNoteTemplate from "../templates/EntryNoteTemplate";
import type { EntryNote } from "../interfaces/entryNote.interface";

const EntryNotePDFPreview = ({ data }: { data: EntryNote }) => (
  <CompanyPDFViewer>
    {(company) => <EntryNoteTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default EntryNotePDFPreview;
