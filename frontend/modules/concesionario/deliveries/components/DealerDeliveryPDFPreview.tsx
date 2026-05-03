import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import DealerDeliveryTemplate from "../templates/DealerDeliveryTemplate";
import type { DealerDelivery } from "../interfaces/dealerDelivery.interface";

const DealerDeliveryPDFPreview = ({ data }: { data: DealerDelivery }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <DealerDeliveryTemplate data={data} />
  </PDFViewer>
);
export default DealerDeliveryPDFPreview;
