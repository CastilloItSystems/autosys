import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import DeliveryTemplate from "../templates/DeliveryTemplate";
import type { VehicleDelivery } from "../interfaces/delivery.interface";

const DeliveryPDFPreview = ({ data }: { data: VehicleDelivery }) => (
  <CompanyPDFViewer>
    {(company) => <DeliveryTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default DeliveryPDFPreview;
