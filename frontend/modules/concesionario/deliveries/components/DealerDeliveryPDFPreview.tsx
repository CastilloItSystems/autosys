import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import DealerDeliveryTemplate from "../templates/DealerDeliveryTemplate";
import type { DealerDelivery } from "../interfaces/dealerDelivery.interface";

const DealerDeliveryPDFPreview = ({ data }: { data: DealerDelivery }) => (
  <CompanyPDFViewer>
    {(company) => <DealerDeliveryTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default DealerDeliveryPDFPreview;
