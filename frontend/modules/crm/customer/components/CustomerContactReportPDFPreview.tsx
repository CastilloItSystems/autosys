import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import CustomerContactReportTemplate from "../templates/CustomerContactReportTemplate";
import type { CustomerCrm } from "../interfaces/customer.crm.interface";

const CustomerContactReportPDFPreview = ({ data }: { data: CustomerCrm }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <CustomerContactReportTemplate data={data} />
  </PDFViewer>
);
export default CustomerContactReportPDFPreview;
