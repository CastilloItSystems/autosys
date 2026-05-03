import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ExitNoteTemplate from "../templates/ExitNoteTemplate";
import type { ExitNote } from "../interfaces/exitNote.interface";

const ExitNotePDFPreview = ({ data }: { data: ExitNote }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ExitNoteTemplate data={data} />
  </PDFViewer>
);
export default ExitNotePDFPreview;
