import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ReturnTemplate from "../templates/ReturnTemplate";
import type { ReturnOrder } from "../services/returnService";

const ReturnPDFPreview = ({ data }: { data: ReturnOrder }) => (
  <CompanyPDFViewer>
    {(company) => <ReturnTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ReturnPDFPreview;
