import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ReceivablesTemplate from "../templates/ReceivablesTemplate";
import type { ReceivableItem } from "../services/receivablesService";

const ReceivablesPDFPreview = ({ data }: { data: ReceivableItem }) => (
  <CompanyPDFViewer>
    {(company) => <ReceivablesTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ReceivablesPDFPreview;
