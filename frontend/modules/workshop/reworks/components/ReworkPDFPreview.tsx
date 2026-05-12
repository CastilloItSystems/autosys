import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ReworkTemplate from "../templates/ReworkTemplate";
import type { WorkshopRework } from "../interfaces/rework.interface";

const ReworkPDFPreview = ({ data }: { data: WorkshopRework }) => (
  <CompanyPDFViewer>
    {(company) => <ReworkTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ReworkPDFPreview;
