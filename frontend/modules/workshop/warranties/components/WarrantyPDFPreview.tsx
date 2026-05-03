import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import WarrantyTemplate from "../templates/WarrantyTemplate";
import type { WorkshopWarranty } from "../interfaces/warranty.interface";

const WarrantyPDFPreview = ({ data }: { data: WorkshopWarranty }) => (
  <PDFViewer width="100%" height="100%">
    <WarrantyTemplate data={data} />
  </PDFViewer>
);
export default WarrantyPDFPreview;
