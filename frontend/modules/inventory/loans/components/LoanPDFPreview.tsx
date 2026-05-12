import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import LoanTemplate from "../templates/LoanTemplate";
import type { Loan } from "../services/loanService";

const LoanPDFPreview = ({ data }: { data: Loan }) => (
  <CompanyPDFViewer>
    {(company) => <LoanTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default LoanPDFPreview;
