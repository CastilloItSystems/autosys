import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import TOTTemplate from "../templates/TOTTemplate";
import type { WorkshopTOT } from "../interfaces/tot.interface";

const TOTPDFPreview = ({ data }: { data: WorkshopTOT }) => (
  <CompanyPDFViewer>
    {(company) => <TOTTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default TOTPDFPreview;
