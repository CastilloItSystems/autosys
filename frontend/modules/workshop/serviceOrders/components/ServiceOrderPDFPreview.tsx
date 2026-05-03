import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ServiceOrderTemplate from "../templates/ServiceOrderTemplate";
import type { ServiceOrder } from "../interfaces/serviceOrder.interface";

const ServiceOrderPDFPreview = ({ data }: { data: ServiceOrder }) => (
  <PDFViewer width="100%" height="100%">
    <ServiceOrderTemplate data={data} />
  </PDFViewer>
);
export default ServiceOrderPDFPreview;
