import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import QualityCheckTemplate from "../templates/QualityCheckTemplate";
import type { QualityCheck } from "../interfaces/qualityCheck.interface";

const QualityCheckPDFPreview = ({ data }: { data: QualityCheck }) => (
  <PDFViewer width="100%" height="100%">
    <QualityCheckTemplate data={data} />
  </PDFViewer>
);
export default QualityCheckPDFPreview;
