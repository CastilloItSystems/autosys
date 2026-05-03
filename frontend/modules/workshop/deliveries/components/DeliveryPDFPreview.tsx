import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import DeliveryTemplate from "../templates/DeliveryTemplate";
import type { VehicleDelivery } from "../interfaces/delivery.interface";

const DeliveryPDFPreview = ({ data }: { data: VehicleDelivery }) => (
  <PDFViewer width="100%" height="100%">
    <DeliveryTemplate data={data} />
  </PDFViewer>
);
export default DeliveryPDFPreview;
