import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import DiagnosisTemplate from "../templates/DiagnosisTemplate";
import type { Diagnosis } from "../interfaces/diagnosis.interface";

const DiagnosisPDFPreview = ({ data }: { data: Diagnosis }) => (
  <PDFViewer width="100%" height="100%">
    <DiagnosisTemplate data={data} />
  </PDFViewer>
);
export default DiagnosisPDFPreview;
