import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import AdjustmentTemplate from "../templates/AdjustmentTemplate";
import type { Adjustment } from "../services/adjustmentService";

const AdjustmentPDFPreview = ({ data }: { data: Adjustment }) => (
  <CompanyPDFViewer>
    {(company) => <AdjustmentTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default AdjustmentPDFPreview;
