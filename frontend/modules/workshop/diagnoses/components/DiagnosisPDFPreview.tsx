import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import DiagnosisTemplate from "../templates/DiagnosisTemplate";
import type { Diagnosis } from "../interfaces/diagnosis.interface";

const DiagnosisPDFPreview = ({ data }: { data: Diagnosis }) => (
  <CompanyPDFViewer>
    {(company) => <DiagnosisTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default DiagnosisPDFPreview;
