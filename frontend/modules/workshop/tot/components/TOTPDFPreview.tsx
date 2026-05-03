import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import TOTTemplate from "../templates/TOTTemplate";
import type { WorkshopTOT } from "../interfaces/tot.interface";

const TOTPDFPreview = ({ data }: { data: WorkshopTOT }) => (
  <PDFViewer width="100%" height="100%">
    <TOTTemplate data={data} />
  </PDFViewer>
);
export default TOTPDFPreview;
