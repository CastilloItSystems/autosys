import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import WarrantyTemplate from "../templates/WarrantyTemplate";
import type { WorkshopWarranty } from "../interfaces/warranty.interface";

const WarrantyPDFPreview = ({ data }: { data: WorkshopWarranty }) => (
  <CompanyPDFViewer>
    {(company) => <WarrantyTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default WarrantyPDFPreview;
