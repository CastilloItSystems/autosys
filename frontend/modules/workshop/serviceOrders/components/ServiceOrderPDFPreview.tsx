import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ServiceOrderTemplate from "../templates/ServiceOrderTemplate";
import type { ServiceOrder } from "../interfaces/serviceOrder.interface";

const ServiceOrderPDFPreview = ({ data }: { data: ServiceOrder }) => (
  <CompanyPDFViewer>
    {(company) => <ServiceOrderTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ServiceOrderPDFPreview;
