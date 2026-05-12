import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import CycleCountResultsTemplate from "../templates/CycleCountResultsTemplate";
import type { CycleCount } from "../interfaces/cycleCount.interface";

const CycleCountPDFPreview = ({ data }: { data: CycleCount }) => (
  <CompanyPDFViewer>
    {(company) => <CycleCountResultsTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default CycleCountPDFPreview;
