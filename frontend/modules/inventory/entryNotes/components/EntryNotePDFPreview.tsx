import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import EntryNoteTemplate from "../templates/EntryNoteTemplate";
import type { EntryNote } from "../interfaces/entryNote.interface";

const EntryNotePDFPreview = ({ data }: { data: EntryNote }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <EntryNoteTemplate data={data} />
  </PDFViewer>
);
export default EntryNotePDFPreview;
