import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import SalesOrderTemplate from "../templates/SalesOrderTemplate";
import type { Order } from "../interfaces/order.interface";

const SalesOrderPDFPreview = ({ data }: { data: Order }) => (
  <CompanyPDFViewer>
    {(company) => <SalesOrderTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);

export default SalesOrderPDFPreview;
