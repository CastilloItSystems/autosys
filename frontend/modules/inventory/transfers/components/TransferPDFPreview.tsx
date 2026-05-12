import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import TransferTemplate from "../templates/TransferTemplate";
import type { Transfer } from "../interfaces/transfer.interface";

const TransferPDFPreview = ({ data }: { data: Transfer }) => (
  <CompanyPDFViewer>
    {(company) => <TransferTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default TransferPDFPreview;
