import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import QualityCheckTemplate from "../templates/QualityCheckTemplate";
import type { QualityCheck } from "../interfaces/qualityCheck.interface";

const QualityCheckPDFPreview = ({ data }: { data: QualityCheck }) => (
  <CompanyPDFViewer>
    {(company) => <QualityCheckTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default QualityCheckPDFPreview;
