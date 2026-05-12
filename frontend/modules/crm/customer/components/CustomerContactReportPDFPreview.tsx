import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import CustomerContactReportTemplate from "../templates/CustomerContactReportTemplate";
import type { CustomerCrm } from "../interfaces/customer.crm.interface";

const CustomerContactReportPDFPreview = ({ data }: { data: CustomerCrm }) => (
  <CompanyPDFViewer>
    {(company) => <CustomerContactReportTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default CustomerContactReportPDFPreview;
